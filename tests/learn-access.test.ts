import { describe, expect, it } from "vitest";
import { canEditCourse, canPublish, canViewCourse } from "@/lib/learn/access";
import { sanitizeLessonContent, sanitizeLessonHtml } from "@/lib/learn/sanitize-lesson";

const mine = { isPublished: false, createdBy: "u1" };
const published = { isPublished: true, createdBy: "u2" };

describe("course access", () => {
  it("keeps a generated course private to its creator", () => {
    expect(canViewCourse(mine, "u1", false)).toBe(true);
    expect(canViewCourse(mine, "u3", false)).toBe(false);
    expect(canViewCourse(mine, "u3", true)).toBe(true);
  });

  it("shows published courses to everyone but lets only the owner or an admin edit", () => {
    expect(canViewCourse(published, "u3", false)).toBe(true);
    expect(canEditCourse(published, "u3", false)).toBe(false);
    expect(canEditCourse(published, "u2", false)).toBe(true);
    expect(canEditCourse(published, "u3", true)).toBe(true);
  });

  it("never treats a missing owner as a match", () => {
    expect(canEditCourse({ isPublished: false, createdBy: null }, "", false)).toBe(false);
    expect(canViewCourse({ isPublished: null, createdBy: null }, "", false)).toBe(false);
  });

  it("keeps publishing an admin act", () => {
    expect(canPublish(false)).toBe(false);
    expect(canPublish(true)).toBe(true);
  });
});

describe("lesson sanitising", () => {
  it("strips scripts, event handlers and javascript links", () => {
    const out = sanitizeLessonHtml(`<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src="x" onerror="y()">`);
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(out).toContain("<p>Hi</p>");
  });

  it("keeps ordinary teaching markup", () => {
    const out = sanitizeLessonHtml(`<h2>Scope 2</h2><ul><li>Grid electricity</li></ul><table><tr><td>1</td></tr></table>`);
    expect(out).toContain("<h2>Scope 2</h2>");
    expect(out).toContain("<li>Grid electricity</li>");
    expect(out).toContain("<td>1</td>");
  });

  it("cleans HTML fields inside lesson content and leaves quiz data alone", () => {
    const out = sanitizeLessonContent({ text: "<iframe src=x></iframe><b>ok</b>", questions: [{ q: "<b>x</b>", correctAnswer: 1 }] });
    expect(out.text).toBe("<b>ok</b>");
    expect(out.questions[0].correctAnswer).toBe(1);
  });
});
