/**
 * Who may see and change a course. Pure rules, shared by every Learn route
 * and covered by tests/learn-access.test.ts.
 *
 * - Published courses are the shared library: every signed-in account sees them.
 * - A course someone generated for their own company is private to its creator
 *   (it can carry company context), until an admin publishes it.
 * - Only the creator or an admin may change or delete a course; only an admin
 *   may create one by hand or publish.
 */

export interface CourseOwnership {
  isPublished: boolean | null;
  createdBy: string | null;
}

export function canViewCourse(course: CourseOwnership, userId: string, admin: boolean): boolean {
  return admin || course.isPublished === true || (!!course.createdBy && course.createdBy === userId);
}

export function canEditCourse(course: CourseOwnership, userId: string, admin: boolean): boolean {
  return admin || (!!course.createdBy && course.createdBy === userId);
}

/** Publishing puts a course in front of every account, so it stays an admin act. */
export function canPublish(admin: boolean): boolean {
  return admin;
}
