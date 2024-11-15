export const parseVersion = (version: string) => {
  const [major, minor, patch] = version.split('.').map((v) => parseInt(v, 10));
  return { major, minor, patch };
};

export const isVersionValid = (
  version: string,
  minVersion?: string,
  maxVersion?: string,
) => {
  if (!version || (!minVersion && !maxVersion)) return true;
  const { major, minor, patch } = parseVersion(version);

  if (minVersion) {
    const {
      major: minMajor,
      minor: minMinor,
      patch: minPatch,
    } = parseVersion(minVersion);
    if (major < minMajor) return false;
    if (major === minMajor && minor < minMinor) return false;
    if (major === minMajor && minor === minMinor && patch < minPatch) {
      return false;
    }
  }

  if (maxVersion) {
    const {
      major: maxMajor,
      minor: maxMinor,
      patch: maxPatch,
    } = parseVersion(maxVersion);
    if (major > maxMajor) return false;
    if (major === maxMajor && minor > maxMinor) return false;
    if (major === maxMajor && minor === maxMinor && patch > maxPatch) {
      return false;
    }
  }

  return true;
};

export const sorter = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});
