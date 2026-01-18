export interface SaveData {
  id: string;
  gameName: string;
  gameId: number;
  timestamp: string;
  localStorage: Record<string, any>;
  indexedDB: Record<string, any>;
  gameState: Record<string, any>;
  fileSize: number;
}

const STORAGE_KEY = 'sapphire_game_saves';

export const useSaveManager = () => {
  const getAllSaves = (): SaveData[] => {
    try {
      const saves = localStorage.getItem(STORAGE_KEY);
      return saves ? JSON.parse(saves) : [];
    } catch (e) {
      console.error('Failed to get saves:', e);
      return [];
    }
  };

  const saveToDB = (saveData: Omit<SaveData, 'id' | 'fileSize'>) => {
    try {
      const saves = getAllSaves();
      const id = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileSize = new Blob([JSON.stringify(saveData)]).size;
      
      const newSave: SaveData = {
        ...saveData,
        id,
        fileSize
      };
      
      saves.push(newSave);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
      return newSave;
    } catch (e) {
      console.error('Failed to save:', e);
      throw e;
    }
  };

  const deleteSave = (saveId: string) => {
    try {
      const saves = getAllSaves();
      const filtered = saves.filter(s => s.id !== saveId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete save:', e);
      throw e;
    }
  };

  const exportSave = (save: SaveData) => {
    try {
      const jsonString = JSON.stringify(save, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${save.gameName}-save-${save.timestamp.split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export save:', e);
      throw e;
    }
  };

  const importSave = (file: File): Promise<SaveData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const contents = e.target?.result as string;
          const saveData = JSON.parse(contents);
          
          if (!saveData.localStorage && !saveData.indexedDB && !saveData.gameState) {
            reject(new Error('Invalid save file format.'));
            return;
          }

          const saved = saveToDB(saveData);
          resolve(saved);
        } catch (error) {
          reject(new Error('Failed to parse save file.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return {
    getAllSaves,
    saveToDB,
    deleteSave,
    exportSave,
    importSave,
    formatFileSize
  };
};
