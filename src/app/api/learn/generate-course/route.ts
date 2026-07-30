import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses, courseModules, lessons, notifications, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateImage } from "@/lib/generators";
import { checkAndDeductAiCredits } from '@/lib/ai-credits';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      industry,
      difficultyLevel,
      userId,
      companyContext
    } = body;

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Check + deduct AI credits (single source of truth: user.aiCreditsBalance)
    const creditGate = await checkAndDeductAiCredits(request, 1, 'course');
    if (!creditGate.ok) {
      return NextResponse.json({ error: creditGate.error }, { status: creditGate.status });
    }

    // Generate course structure using Gemini
    const courseStructure = await generateCourseStructure(
      topic,
      industry,
      difficultyLevel,
      companyContext
    );

    // Track credit for course structure generation

    // Generate course thumbnail image
    let thumbnailUrl = null;
    try {
      console.log(`Generating thumbnail for course: ${courseStructure.title}`);
      const thumbnailPrompt = `Professional wide banner for "${courseStructure.title}" sustainability course, modern flat design illustration, clean horizontal composition, ${industry} industry theme with green environmental elements, technology and innovation motifs, high quality digital art, 21:9 ultra-wide format`;
      
      const result = await generateImage(thumbnailPrompt, "21:9");
      if (result.url) {
        thumbnailUrl = result.url;
        console.log(`✓ Thumbnail generated successfully`);
        
        // Track credit for thumbnail generation
      }
    } catch (error) {
      console.error("Failed to generate course thumbnail:", error);
    }

    // Create course in database
    const [newCourse] = await db.insert(courses).values({
      title: courseStructure.title,
      description: courseStructure.description,
      industry,
      difficultyLevel,
      estimatedHours: courseStructure.estimatedHours || 4,
      isPublished: true,
      thumbnailUrl: thumbnailUrl,
      createdBy: userId || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    const courseId = newCourse.id;

    // Generate modules and lessons with rich media content
    for (const [moduleIndex, module] of courseStructure.modules.entries()) {
      const [newModule] = await db.insert(courseModules).values({
        courseId,
        order: moduleIndex + 1,
        title: module.title,
        description: module.description,
        estimatedMinutes: module.estimatedMinutes,
        createdAt: new Date().toISOString()
      }).returning();

      const moduleId = newModule.id;

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        // Generate media if needed
        let enhancedContent = { ...lesson.content };


        // Generate image for text lessons
        if (lesson.contentType === "text" && lesson.needsImage && lesson.imagePrompt) {
          try {
            console.log(`Generating image for lesson: ${lesson.title}`);
            const result = await generateImage(lesson.imagePrompt, "16:9");
            
            if (result.url) {
              const imageUrl = result.url;
              enhancedContent.imageUrl = imageUrl;
              // Add image to HTML content at the beginning
              if (enhancedContent.text) {
                enhancedContent.text = `<img src="${imageUrl}" alt="${lesson.title}" style="width:100%;max-width:800px;height:auto;border-radius:8px;margin-bottom:1.5rem;" />${enhancedContent.text}`;
              }
              console.log(`✓ Image generated for: ${lesson.title}`);
              
              // Track credit for image generation
            }
          } catch (error) {
            console.error(`Failed to generate image for ${lesson.title}:`, error);
          }
        }

        await db.insert(lessons).values({
          moduleId,
          order: lessonIndex + 1,
          title: lesson.title,
          contentType: lesson.contentType,
          contentJson: JSON.stringify(enhancedContent),
          estimatedMinutes: lesson.estimatedMinutes,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Create notifications only if userId is valid
    if (userId) {
      try {
        // Verify user exists before creating notification
        const userExists = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
        
        if (userExists.length > 0) {
          // Create notification for the user who generated the course
          await db.insert(notifications).values({
            userId: userId,
            type: 'system_alert',
            title: '🎓 New Course Available',
            message: `"${courseStructure.title}" has been generated and is ready for you!`,
            link: `/app/learn/${courseId}`,
            metadata: JSON.stringify({
              courseId,
              title: courseStructure.title,
              industry,
              difficultyLevel,
              estimatedHours: courseStructure.estimatedHours
            }),
            isRead: false,
            createdAt: new Date().toISOString()
          });

          // Notify all other users about the new course (system-wide)
          const allUsers = await db.select({ id: user.id }).from(user);
          const otherUsers = allUsers.filter(u => u.id !== userId);
          
          if (otherUsers.length > 0) {
            await Promise.all(otherUsers.map(u => 
              db.insert(notifications).values({
                userId: u.id,
                type: 'insight_available',
                title: '📚 New Course Published',
                message: `A new ${difficultyLevel} course on "${topic}" is now available in the Learning Center.`,
                link: `/app/learn`,
                metadata: JSON.stringify({
                  courseId,
                  title: courseStructure.title,
                  industry,
                  difficultyLevel
                }),
                isRead: false,
                createdAt: new Date().toISOString()
              })
            ));
          }
        }
      } catch (notificationError) {
        // Log but don't fail the request if notifications fail
        console.error("Failed to create notifications:", notificationError);
      }
    }

    return NextResponse.json({ 
      courseId,
      message: "Course generated successfully"
    });
  } catch (error: any) {
    console.error("Failed to generate course:", error);
    return NextResponse.json(
      { error: "Failed to generate course" },
      { status: 500 }
    );
  }
}

async function generateCourseStructure(
  topic: string,
  industry: string,
  difficultyLevel: string,
  companyContext: any
) {
  const prompt = `You are a sustainability education expert creating professional, comprehensive courses for business professionals.

Topic: ${topic}
Industry: ${industry}
Difficulty: ${difficultyLevel}
${companyContext ? `Company Context: ${JSON.stringify(companyContext)}` : ''}

Create a DETAILED, COMPREHENSIVE course with substantial educational value:

CRITICAL REQUIREMENTS:
- Each text lesson MUST contain 800-1500 words of rich, detailed content
- Include multiple sections with H2/H3 headings
- Provide specific industry examples, case studies, and real-world scenarios
- Add actionable steps, best practices, and implementation guidance
- Include statistics, data points, and research findings where relevant
- Use proper HTML formatting with paragraphs, lists, bold/italic emphasis
- Make content practical and immediately applicable for ${industry} businesses

Course Structure:
- 3-4 comprehensive modules
- 4-5 detailed lessons per module
- Mix of content types: text (detailed articles), video (demonstrations), quiz (knowledge checks), exercise (hands-on activities)
- Total estimated time: 4-8 hours of substantial learning

Content Depth Guidelines:
- Text lessons: 800-1500 words, multiple sections, examples, case studies
- Video lessons: Include detailed descriptions and learning objectives
- Quizzes: 4-6 questions with detailed explanations
- Exercises: Multi-step practical activities with clear deliverables

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks). Structure:

{
  "title": "Engaging Professional Course Title",
  "description": "Comprehensive 3-4 sentence description explaining course value, learning outcomes, and target audience",
  "estimatedHours": 6,
  "modules": [
    {
      "title": "Module Title",
      "description": "Detailed module description (2-3 sentences)",
      "estimatedMinutes": 120,
      "lessons": [
        {
          "title": "Detailed Lesson Title",
          "contentType": "text",
          "estimatedMinutes": 25,
          "content": {
            "text": "<h2>Main Section Heading</h2><p>Comprehensive opening paragraph introducing the topic with context and relevance for ${industry} businesses. Include specific examples and data points.</p><h3>Subsection 1: Key Concept</h3><p>Detailed explanation with multiple paragraphs covering the concept thoroughly. Include real-world examples, case studies, and specific applications for ${industry}.</p><ul><li><strong>Point 1:</strong> Detailed explanation with examples</li><li><strong>Point 2:</strong> Detailed explanation with data</li><li><strong>Point 3:</strong> Detailed explanation with best practices</li></ul><h3>Subsection 2: Implementation</h3><p>Step-by-step guidance with specific actions. Multiple paragraphs covering different aspects.</p><h3>Subsection 3: Common Challenges</h3><p>Detailed discussion of challenges and solutions specific to ${industry}.</p><p>Concluding paragraph with key takeaways and next steps.</p>"
          },
          "needsImage": true,
          "imagePrompt": "Professional ${industry} sustainability concept illustration showing ${topic}, modern clean style, corporate context, high quality"
        },
        {
          "title": "Video Demonstration Title",
          "contentType": "video",
          "estimatedMinutes": 10,
          "content": {
            "text": "<p>Detailed video lesson description with learning objectives and key takeaways</p>"
          },
          "needsVideo": true,
          "videoPrompt": "Professional demonstration of ${topic} in ${industry} context, clean modern style, 8 seconds"
        },
        {
          "title": "Knowledge Assessment",
          "contentType": "quiz",
          "estimatedMinutes": 15,
          "content": {
            "questions": [
              {
                "question": "Detailed question text?",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correctAnswer": 0,
                "explanation": "Comprehensive 2-3 sentence explanation of why this is correct and why other options are incorrect"
              }
            ]
          }
        }
      ]
    }
  ]
}`;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gemini/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const result = await response.json();
    
    // Try to parse the response, cleaning markdown code blocks if present
    let cleanedText = result.text.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const parsed = JSON.parse(cleanedText);
    
    // Validate structure
    if (parsed.modules && parsed.modules.length > 0) {
      return parsed;
    }
    
    throw new Error("Invalid course structure");
  } catch (error) {
    console.error("Failed to parse Gemini response, using fallback:", error);
    
    // Comprehensive fallback structure with rich content
    return createFallbackCourse(topic, industry, difficultyLevel);
  }
}

function createFallbackCourse(topic: string, industry: string, difficultyLevel: string) {
  return {
    title: `${topic} for ${industry} Businesses`,
    description: `A comprehensive ${difficultyLevel} course designed to help ${industry} businesses implement sustainable practices, reduce environmental impact, and achieve their sustainability goals. Through detailed modules covering theory, practical implementation, and real-world case studies, you'll gain the knowledge and tools needed to drive meaningful change in your organization.`,
    estimatedHours: 6,
    modules: [
      {
        title: "Foundations of Sustainable Business Practices",
        description: "Build a solid foundation in sustainability principles, understand the business case, and learn how to align environmental goals with business objectives.",
        estimatedMinutes: 120,
        lessons: [
          {
            title: "Welcome & Comprehensive Course Overview",
            contentType: "text",
            estimatedMinutes: 20,
            content: {
              text: `<h2>Welcome to ${topic}</h2>
<p>Welcome to this comprehensive professional development course specifically designed for <strong>${industry}</strong> businesses seeking to enhance their sustainability practices and create lasting environmental impact. In today's business landscape, sustainability is no longer optional—it's a critical component of long-term success, risk management, and competitive advantage.</p>

<p>This course represents a carefully curated learning journey that combines theoretical foundations with practical, actionable strategies. Whether you're just beginning your sustainability journey or looking to enhance existing programs, this course will provide you with the tools, frameworks, and knowledge needed to drive meaningful change within your organization.</p>

<h3>What You'll Learn Throughout This Course</h3>
<p>Over the coming modules, you'll gain comprehensive knowledge across multiple dimensions of sustainability:</p>

<ul>
  <li><strong>Core Sustainability Principles:</strong> Understanding the fundamental concepts of environmental stewardship, including the triple bottom line (people, planet, profit), circular economy principles, and systems thinking approaches to business operations.</li>
  <li><strong>Industry-Specific Applications:</strong> Tailored strategies and best practices specifically relevant to the ${industry} sector, including common challenges, regulatory requirements, and proven solutions implemented by industry leaders.</li>
  <li><strong>Measurement & Reporting:</strong> Learn how to establish baseline metrics, track progress using industry-standard frameworks (GRI, SASB, TCFD), and communicate your sustainability performance to stakeholders effectively.</li>
  <li><strong>Implementation Strategies:</strong> Step-by-step guidance for implementing sustainable practices, from quick wins that can be achieved immediately to long-term transformational initiatives that require strategic planning and investment.</li>
  <li><strong>Stakeholder Engagement:</strong> Techniques for building internal buy-in, engaging employees, communicating with customers, and collaborating with suppliers to create systemic change across your value chain.</li>
</ul>

<h3>Course Structure & Learning Approach</h3>
<p>This course is organized into four comprehensive modules, each building upon the previous one to create a complete learning experience:</p>

<ol>
  <li><strong>Foundations (Module 1):</strong> Establishing your sustainability knowledge base and understanding the business case</li>
  <li><strong>Measurement (Module 2):</strong> Learning to quantify, track, and report on your environmental impact</li>
  <li><strong>Implementation (Module 3):</strong> Putting theory into practice with actionable strategies and real-world applications</li>
  <li><strong>Continuous Improvement (Module 4):</strong> Building systems for ongoing progress, reporting, and stakeholder engagement</li>
</ol>

<p>Each module contains a variety of content types designed to accommodate different learning styles. You'll encounter detailed educational content, practical exercises, knowledge assessments, and real-world case studies. The estimated completion time is 6 hours, but we encourage you to take the time you need to fully absorb and apply the concepts.</p>

<h3>Who Should Take This Course</h3>
<p>This course is designed for business professionals in the ${industry} sector, including:</p>
<ul>
  <li>Sustainability managers and coordinators</li>
  <li>Operations and facility managers</li>
  <li>Executive leadership and decision-makers</li>
  <li>Department heads responsible for implementing sustainable practices</li>
  <li>Anyone passionate about driving positive environmental change in their organization</li>
</ul>

<h3>How to Get the Most from This Course</h3>
<p>To maximize your learning experience, we recommend:</p>
<ul>
  <li>Setting aside dedicated time for each module without distractions</li>
  <li>Taking notes and documenting ideas specific to your organization</li>
  <li>Completing all exercises and assessments to reinforce learning</li>
  <li>Sharing key concepts with colleagues to build organizational awareness</li>
  <li>Applying concepts in real-time as you progress through the course</li>
</ul>

<p><strong>Let's begin your sustainability transformation journey!</strong></p>`
            },
            needsImage: true,
            imagePrompt: `Professional welcome banner for ${industry} sustainability course, modern corporate design, clean minimal style, featuring green environmental themes`
          }
        ]
      }
    ]
  };
}