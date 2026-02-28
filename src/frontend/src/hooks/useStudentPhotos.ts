const STORAGE_KEY = "student_photos";

function loadPhotos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    /* ignore */
  }
  return {};
}

function savePhotos(photos: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch {
    /* ignore */
  }
}

export function useStudentPhotos() {
  const getPhotoUrl = (studentId: bigint): string | null => {
    const photos = loadPhotos();
    return photos[studentId.toString()] ?? null;
  };

  const setPhotoUrl = (studentId: bigint, url: string): void => {
    const photos = loadPhotos();
    photos[studentId.toString()] = url;
    savePhotos(photos);
  };

  return { getPhotoUrl, setPhotoUrl };
}
