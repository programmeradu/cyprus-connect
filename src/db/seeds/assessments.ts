import { db } from '@/db';
import { assessments, lessons } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Query all quiz-type lessons
    const quizLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.contentType, 'quiz'));

    if (quizLessons.length === 0) {
        console.log('⚠️ No quiz lessons found. Please seed lessons first.');
        return;
    }

    const assessmentsData = quizLessons.map((lesson) => {
        let questionsArray;

        // Generate questions based on lesson title
        if (lesson.title.includes('Module 1 Quiz')) {
            questionsArray = [
                {
                    id: 1,
                    question: "What is the greenhouse gas protocol?",
                    type: "multiple-choice",
                    options: [
                        "A framework for calculating carbon emissions",
                        "A type of greenhouse",
                        "A weather measurement tool",
                        "A carbon trading system"
                    ],
                    correctAnswer: "A framework for calculating carbon emissions"
                },
                {
                    id: 2,
                    question: "Which of the following is NOT a major greenhouse gas?",
                    type: "multiple-choice",
                    options: [
                        "Carbon dioxide (CO2)",
                        "Methane (CH4)",
                        "Oxygen (O2)",
                        "Nitrous oxide (N2O)"
                    ],
                    correctAnswer: "Oxygen (O2)"
                },
                {
                    id: 3,
                    question: "What is a carbon footprint?",
                    type: "multiple-choice",
                    options: [
                        "The total amount of greenhouse gases produced by human activities",
                        "The size of a person's shoe",
                        "A type of renewable energy",
                        "A measurement of air quality"
                    ],
                    correctAnswer: "The total amount of greenhouse gases produced by human activities"
                },
                {
                    id: 4,
                    question: "Carbon accounting helps organizations to:",
                    type: "multiple-choice",
                    options: [
                        "Track and measure their greenhouse gas emissions",
                        "Calculate their tax obligations",
                        "Measure employee productivity",
                        "Determine stock prices"
                    ],
                    correctAnswer: "Track and measure their greenhouse gas emissions"
                },
                {
                    id: 5,
                    question: "What unit is commonly used to measure carbon emissions?",
                    type: "multiple-choice",
                    options: [
                        "Tons of CO2 equivalent (tCO2e)",
                        "Kilowatts (kW)",
                        "Liters (L)",
                        "Pounds per square inch (PSI)"
                    ],
                    correctAnswer: "Tons of CO2 equivalent (tCO2e)"
                }
            ];
        } else if (lesson.title.includes('Module 2 Assessment')) {
            questionsArray = [
                {
                    id: 1,
                    question: "What are Scope 1 emissions?",
                    type: "multiple-choice",
                    options: [
                        "Direct emissions from owned or controlled sources",
                        "Indirect emissions from purchased electricity",
                        "Indirect emissions from the value chain",
                        "Emissions from renewable sources"
                    ],
                    correctAnswer: "Direct emissions from owned or controlled sources"
                },
                {
                    id: 2,
                    question: "Which of the following is a Scope 2 emission?",
                    type: "multiple-choice",
                    options: [
                        "Company vehicle fuel consumption",
                        "Purchased electricity for office buildings",
                        "Business travel by employees",
                        "Supplier transportation"
                    ],
                    correctAnswer: "Purchased electricity for office buildings"
                },
                {
                    id: 3,
                    question: "Scope 3 emissions include:",
                    type: "multiple-choice",
                    options: [
                        "Emissions from company-owned vehicles",
                        "Emissions from on-site generators",
                        "Emissions from supply chain and business travel",
                        "Emissions from company-owned renewable sources"
                    ],
                    correctAnswer: "Emissions from supply chain and business travel"
                },
                {
                    id: 4,
                    question: "Which emission scope is typically the largest for most organizations?",
                    type: "multiple-choice",
                    options: [
                        "Scope 1",
                        "Scope 2",
                        "Scope 3",
                        "All are equal"
                    ],
                    correctAnswer: "Scope 3"
                },
                {
                    id: 5,
                    question: "Natural gas used in company facilities is classified as:",
                    type: "multiple-choice",
                    options: [
                        "Scope 1 emissions",
                        "Scope 2 emissions",
                        "Scope 3 emissions",
                        "Not counted in carbon accounting"
                    ],
                    correctAnswer: "Scope 1 emissions"
                }
            ];
        } else if (lesson.title.includes('Final Assessment') && lesson.title.includes('Carbon')) {
            questionsArray = [
                {
                    id: 1,
                    question: "Which strategy is most effective for reducing Scope 1 emissions?",
                    type: "multiple-choice",
                    options: [
                        "Transitioning to electric vehicle fleets",
                        "Buying carbon offsets",
                        "Reducing office paper use",
                        "Installing LED lights"
                    ],
                    correctAnswer: "Transitioning to electric vehicle fleets"
                },
                {
                    id: 2,
                    question: "What is the primary benefit of setting science-based targets?",
                    type: "multiple-choice",
                    options: [
                        "They align with what science says is needed to meet Paris Agreement goals",
                        "They are easier to achieve than other targets",
                        "They require less measurement",
                        "They don't need third-party verification"
                    ],
                    correctAnswer: "They align with what science says is needed to meet Paris Agreement goals"
                },
                {
                    id: 3,
                    question: "Which of the following is a carbon reduction strategy for Scope 2 emissions?",
                    type: "multiple-choice",
                    options: [
                        "Switching to renewable energy providers",
                        "Optimizing delivery routes",
                        "Reducing business travel",
                        "Working with sustainable suppliers"
                    ],
                    correctAnswer: "Switching to renewable energy providers"
                },
                {
                    id: 4,
                    question: "What is the difference between carbon neutrality and net zero?",
                    type: "multiple-choice",
                    options: [
                        "Net zero requires deeper emission cuts with limited offsetting",
                        "They are the same thing",
                        "Carbon neutrality is more ambitious",
                        "Net zero only applies to Scope 1 emissions"
                    ],
                    correctAnswer: "Net zero requires deeper emission cuts with limited offsetting"
                },
                {
                    id: 5,
                    question: "Energy efficiency improvements typically have what impact?",
                    type: "multiple-choice",
                    options: [
                        "Reduce both emissions and operational costs",
                        "Only reduce emissions",
                        "Only reduce costs",
                        "Neither impact emissions nor costs"
                    ],
                    correctAnswer: "Reduce both emissions and operational costs"
                }
            ];
        } else if (lesson.title.includes('Solar Quiz')) {
            questionsArray = [
                {
                    id: 1,
                    question: "What is the primary advantage of solar photovoltaic (PV) technology?",
                    type: "multiple-choice",
                    options: [
                        "Converts sunlight directly into electricity with no moving parts",
                        "Only works in cold climates",
                        "Requires constant maintenance",
                        "Can only power small devices"
                    ],
                    correctAnswer: "Converts sunlight directly into electricity with no moving parts"
                },
                {
                    id: 2,
                    question: "What is the typical lifespan of modern solar panels?",
                    type: "multiple-choice",
                    options: [
                        "5-10 years",
                        "10-15 years",
                        "25-30 years",
                        "50+ years"
                    ],
                    correctAnswer: "25-30 years"
                },
                {
                    id: 3,
                    question: "Which factor most affects solar panel efficiency?",
                    type: "multiple-choice",
                    options: [
                        "Angle of installation and sunlight exposure",
                        "Color of the building",
                        "Distance from the equator only",
                        "Time of installation"
                    ],
                    correctAnswer: "Angle of installation and sunlight exposure"
                },
                {
                    id: 4,
                    question: "What is net metering?",
                    type: "multiple-choice",
                    options: [
                        "A billing mechanism that credits solar owners for excess electricity",
                        "The total cost of solar installation",
                        "A type of solar panel",
                        "A measurement of solar efficiency"
                    ],
                    correctAnswer: "A billing mechanism that credits solar owners for excess electricity"
                },
                {
                    id: 5,
                    question: "Solar energy is considered renewable because:",
                    type: "multiple-choice",
                    options: [
                        "The sun provides consistent energy that won't be depleted",
                        "Solar panels never break",
                        "It's the cheapest energy source",
                        "It can be stored indefinitely"
                    ],
                    correctAnswer: "The sun provides consistent energy that won't be depleted"
                }
            ];
        } else if (lesson.title.includes('Wind Assessment')) {
            questionsArray = [
                {
                    id: 1,
                    question: "How do wind turbines generate electricity?",
                    type: "multiple-choice",
                    options: [
                        "Wind spins blades connected to a generator that produces electricity",
                        "Wind heats up the turbine to create steam",
                        "Wind compresses air that powers engines",
                        "Wind charges batteries directly"
                    ],
                    correctAnswer: "Wind spins blades connected to a generator that produces electricity"
                },
                {
                    id: 2,
                    question: "What is the main advantage of offshore wind farms?",
                    type: "multiple-choice",
                    options: [
                        "Stronger and more consistent winds",
                        "Easier to install",
                        "Lower maintenance costs",
                        "No environmental impact"
                    ],
                    correctAnswer: "Stronger and more consistent winds"
                },
                {
                    id: 3,
                    question: "What is capacity factor in wind energy?",
                    type: "multiple-choice",
                    options: [
                        "The ratio of actual energy produced to maximum possible energy",
                        "The number of turbines in a wind farm",
                        "The cost per kilowatt",
                        "The height of the turbine"
                    ],
                    correctAnswer: "The ratio of actual energy produced to maximum possible energy"
                },
                {
                    id: 4,
                    question: "Which location is typically best for wind turbines?",
                    type: "multiple-choice",
                    options: [
                        "Areas with consistent strong winds like coastal regions",
                        "Dense urban areas",
                        "Deep valleys",
                        "Near the equator only"
                    ],
                    correctAnswer: "Areas with consistent strong winds like coastal regions"
                },
                {
                    id: 5,
                    question: "Modern wind turbines can power approximately how many homes?",
                    type: "multiple-choice",
                    options: [
                        "10-50 homes",
                        "100-500 homes",
                        "1,000-2,000 homes",
                        "10,000+ homes"
                    ],
                    correctAnswer: "1,000-2,000 homes"
                }
            ];
        } else if (lesson.title.includes('Final Exam') && lesson.title.includes('Renewable')) {
            questionsArray = [
                {
                    id: 1,
                    question: "What is the first step in implementing a renewable energy plan?",
                    type: "multiple-choice",
                    options: [
                        "Conducting an energy audit to understand current consumption",
                        "Installing solar panels immediately",
                        "Buying renewable energy certificates",
                        "Hiring more staff"
                    ],
                    correctAnswer: "Conducting an energy audit to understand current consumption"
                },
                {
                    id: 2,
                    question: "Which factor is most important when choosing between renewable technologies?",
                    type: "multiple-choice",
                    options: [
                        "Local climate, resources, and energy needs",
                        "The newest technology available",
                        "The cheapest option",
                        "What competitors are doing"
                    ],
                    correctAnswer: "Local climate, resources, and energy needs"
                },
                {
                    id: 3,
                    question: "What is a Power Purchase Agreement (PPA)?",
                    type: "multiple-choice",
                    options: [
                        "A contract to buy renewable energy at a fixed price",
                        "A loan for solar panels",
                        "A government subsidy",
                        "A type of energy storage"
                    ],
                    correctAnswer: "A contract to buy renewable energy at a fixed price"
                },
                {
                    id: 4,
                    question: "Why is energy storage important for renewable energy systems?",
                    type: "multiple-choice",
                    options: [
                        "To store excess energy for use when renewable sources aren't generating",
                        "To increase the cost of the system",
                        "To reduce the need for renewable sources",
                        "To replace renewable sources entirely"
                    ],
                    correctAnswer: "To store excess energy for use when renewable sources aren't generating"
                },
                {
                    id: 5,
                    question: "What is a typical payback period for commercial solar installations?",
                    type: "multiple-choice",
                    options: [
                        "1-2 years",
                        "5-10 years",
                        "15-20 years",
                        "30+ years"
                    ],
                    correctAnswer: "5-10 years"
                }
            ];
        } else if (lesson.title.includes('Framework Quiz')) {
            questionsArray = [
                {
                    id: 1,
                    question: "What does GRI stand for?",
                    type: "multiple-choice",
                    options: [
                        "Global Reporting Initiative",
                        "Green Resource Index",
                        "Government Regulatory Institution",
                        "General Risk Indicator"
                    ],
                    correctAnswer: "Global Reporting Initiative"
                },
                {
                    id: 2,
                    question: "What is the primary focus of SASB standards?",
                    type: "multiple-choice",
                    options: [
                        "Financial materiality of ESG issues for investors",
                        "Environmental impact only",
                        "Social programs",
                        "Governance structures"
                    ],
                    correctAnswer: "Financial materiality of ESG issues for investors"
                },
                {
                    id: 3,
                    question: "What does TCFD stand for?",
                    type: "multiple-choice",
                    options: [
                        "Task Force on Climate-related Financial Disclosures",
                        "Total Carbon Footprint Data",
                        "Technical Committee for Development",
                        "Trade Council for Fair Development"
                    ],
                    correctAnswer: "Task Force on Climate-related Financial Disclosures"
                },
                {
                    id: 4,
                    question: "Which framework is most focused on climate risk disclosure?",
                    type: "multiple-choice",
                    options: [
                        "TCFD",
                        "GRI",
                        "SASB",
                        "ISO 14001"
                    ],
                    correctAnswer: "TCFD"
                },
                {
                    id: 5,
                    question: "GRI standards are organized into:",
                    type: "multiple-choice",
                    options: [
                        "Universal, Sector, and Topic Standards",
                        "Environmental and Social only",
                        "Annual and Quarterly reports",
                        "Mandatory and Optional sections"
                    ],
                    correctAnswer: "Universal, Sector, and Topic Standards"
                }
            ];
        } else if (lesson.title.includes('Final ESG Assessment')) {
            questionsArray = [
                {
                    id: 1,
                    question: "What is the purpose of materiality assessment in ESG reporting?",
                    type: "multiple-choice",
                    options: [
                        "To identify which ESG topics are most important to the business and stakeholders",
                        "To measure the weight of company assets",
                        "To calculate carbon emissions",
                        "To determine employee salaries"
                    ],
                    correctAnswer: "To identify which ESG topics are most important to the business and stakeholders"
                },
                {
                    id: 2,
                    question: "What is double materiality?",
                    type: "multiple-choice",
                    options: [
                        "Considering both financial impact on company and company impact on society/environment",
                        "Reporting twice per year",
                        "Using two different frameworks",
                        "Having two audit firms"
                    ],
                    correctAnswer: "Considering both financial impact on company and company impact on society/environment"
                },
                {
                    id: 3,
                    question: "Which stakeholder group is typically most interested in ESG reports?",
                    type: "multiple-choice",
                    options: [
                        "Investors, customers, employees, and regulators",
                        "Only shareholders",
                        "Only government agencies",
                        "Only environmental groups"
                    ],
                    correctAnswer: "Investors, customers, employees, and regulators"
                },
                {
                    id: 4,
                    question: "What is the role of third-party assurance in ESG reporting?",
                    type: "multiple-choice",
                    options: [
                        "To verify the accuracy and reliability of reported ESG data",
                        "To write the report for the company",
                        "To set ESG targets",
                        "To implement ESG programs"
                    ],
                    correctAnswer: "To verify the accuracy and reliability of reported ESG data"
                },
                {
                    id: 5,
                    question: "What trend is emerging in ESG reporting requirements?",
                    type: "multiple-choice",
                    options: [
                        "Increasing regulatory mandates for disclosure",
                        "Decreasing interest from investors",
                        "Less focus on climate risk",
                        "Simplified reporting standards"
                    ],
                    correctAnswer: "Increasing regulatory mandates for disclosure"
                }
            ];
        } else {
            // Default questions for any other quiz
            questionsArray = [
                {
                    id: 1,
                    question: "What is sustainability?",
                    type: "multiple-choice",
                    options: [
                        "Meeting present needs without compromising future generations",
                        "Only about environmental protection",
                        "A marketing strategy",
                        "A temporary trend"
                    ],
                    correctAnswer: "Meeting present needs without compromising future generations"
                },
                {
                    id: 2,
                    question: "Which is a key principle of sustainable business?",
                    type: "multiple-choice",
                    options: [
                        "Balancing economic, social, and environmental factors",
                        "Maximizing short-term profits only",
                        "Ignoring stakeholder concerns",
                        "Focusing only on compliance"
                    ],
                    correctAnswer: "Balancing economic, social, and environmental factors"
                },
                {
                    id: 3,
                    question: "What does ESG stand for?",
                    type: "multiple-choice",
                    options: [
                        "Environmental, Social, and Governance",
                        "Energy, Systems, and Growth",
                        "Economic, Strategic, and Global",
                        "Ethical, Sustainable, and Green"
                    ],
                    correctAnswer: "Environmental, Social, and Governance"
                },
                {
                    id: 4,
                    question: "Why is sustainability important for businesses?",
                    type: "multiple-choice",
                    options: [
                        "It reduces risks and creates long-term value",
                        "It's only required by law",
                        "It has no business benefits",
                        "It only matters to non-profits"
                    ],
                    correctAnswer: "It reduces risks and creates long-term value"
                },
                {
                    id: 5,
                    question: "What is a key benefit of sustainability reporting?",
                    type: "multiple-choice",
                    options: [
                        "Increased transparency and stakeholder trust",
                        "Higher costs with no benefits",
                        "Reduced business performance",
                        "Less investor interest"
                    ],
                    correctAnswer: "Increased transparency and stakeholder trust"
                }
            ];
        }

        return {
            lessonId: lesson.id,
            passingScore: 70,
            maxAttempts: 3,
            questionsJson: JSON.stringify(questionsArray),
            createdAt: new Date('2024-01-20').toISOString(),
        };
    });

    await db.insert(assessments).values(assessmentsData);
    
    console.log(`✅ Assessments seeder completed successfully - Created ${assessmentsData.length} assessments`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});