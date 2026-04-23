/**
 * GitLab API accepts either the numeric project ID or the URL-encoded
 * full path (e.g. "group/subgroup/project"). Normalise both forms here so
 * callers don't have to remember the encoding rule.
 */
export const encodeProjectId = (projectIdOrPath: string | number): string => {
  if (typeof projectIdOrPath === 'number') {
    return String(projectIdOrPath);
  }

  if (/^\d+$/.test(projectIdOrPath)) {
    return projectIdOrPath;
  }

  return encodeURIComponent(projectIdOrPath);
};
