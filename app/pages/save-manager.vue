<template>
  <div class="save-manager-container">
    <div class="manager-wrapper">
      <!-- Header -->
      <div class="manager-header">
        <div class="header-title">
          <h1>Game Save Manager</h1>
          <p class="save-count">{{ saves.length }} save{{ saves.length !== 1 ? 's' : '' }} found</p>
        </div>
        <div class="header-actions">
          <button @click="captureAllBrowserSaves" class="action-btn">📸 Capture Save</button>
          <button @click="triggerImport" class="action-btn">📤 Import Save</button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="importSave"
          />
        </div>
      </div>

      <!-- Saves List -->
      <div v-if="filteredSaves.length > 0" class="saves-list">
        <div v-for="save in filteredSaves" :key="save.id" class="save-card">
          <div class="save-header">
            <div class="save-info">
              <h3>{{ save.gameName }}</h3>
              <p class="game-id">Game ID: {{ save.gameId }}</p>
            </div>
            <div class="save-meta">
              <span class="save-date">{{ formatDate(save.timestamp) }}</span>
              <span class="save-size">{{ formatFileSize(save.fileSize) }}</span>
            </div>
          </div>

          <div class="save-details">
            <span v-if="save.localStorage && Object.keys(save.localStorage).length > 0" class="detail-badge">
              📝 localStorage ({{ Object.keys(save.localStorage).length }} items)
            </span>
            <span v-if="save.indexedDB && Object.keys(save.indexedDB).length > 0" class="detail-badge">
              💾 IndexedDB ({{ Object.keys(save.indexedDB).length }} databases)
            </span>
            <span v-if="save.gameState && Object.keys(save.gameState).length > 0" class="detail-badge">
              🎮 Game State
            </span>
          </div>

          <div class="save-actions">
            <button @click="restoreSave(save)" class="action-small-btn restore">Restore</button>
            <button @click="downloadSave(save)" class="action-small-btn download">Download</button>
            <button @click="deleteSaveConfirm(save)" class="action-small-btn delete">Delete</button>
          </div>
        </div>
      </div>

      <!-- No Saves -->
      <div v-else class="no-saves">
        <p>No saves found. Import a save or export from a game to get started!</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useSaveManager, type SaveData } from '~/composables/useSaveManager';
import { useRouter } from 'vue-router';

const router = useRouter();
const { getAllSaves, deleteSave, exportSave, importSave: importSaveManager, formatFileSize, saveToDB } = useSaveManager();

const saves = ref<SaveData[]>([]);
const searchQuery = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const filteredSaves = computed(() => {
  return saves.value
    .filter(save =>
      save.gameName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
});

onMounted(() => {
  loadSaves();
});

const loadSaves = () => {
  saves.value = getAllSaves();
};

const captureAllBrowserSaves = async () => {
  try {
    // Collect all localStorage data
    let localStorageData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        localStorageData[key] = localStorage.getItem(key);
      }
    }

    // Collect all IndexedDB data
    let indexedDBData: Record<string, any> = {};
    try {
      const dbs = await (window.indexedDB as any).databases?.() || [];
      
      for (const dbInfo of dbs) {
        const dbName = dbInfo.name;
        const request = window.indexedDB.open(dbName);
        
        await new Promise((resolve) => {
          request.onsuccess = async () => {
            const db = request.result;
            indexedDBData[dbName] = {};
            
            for (let i = 0; i < db.objectStoreNames.length; i++) {
              const storeName = db.objectStoreNames[i];
              
              const storeRequest = db.transaction(storeName, 'readonly')
                .objectStore(storeName)
                .getAll();
              
              storeRequest.onsuccess = () => {
                indexedDBData[dbName][storeName] = storeRequest.result;
              };
            }
            
            db.close();
            resolve(null);
          };
          
          request.onerror = () => {
            console.log('Could not access IndexedDB:', dbName);
            resolve(null);
          };
        });
      }
    } catch (e) {
      console.log('Could not access IndexedDB:', e);
    }

    const saveData = {
      gameName: 'All Browser Data',
      gameId: 0,
      timestamp: new Date().toISOString(),
      localStorage: localStorageData,
      indexedDB: indexedDBData,
      gameState: {}
    };

    saveToDB(saveData);
    loadSaves();
    alert('Browser saves captured successfully!');
  } catch (error) {
    console.error('Failed to capture browser saves:', error);
    alert('Failed to capture browser saves.');
  }
};

const triggerImport = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const importSave = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    await importSaveManager(file);
    loadSaves();
    alert('Save imported successfully!');
  } catch (error) {
    console.error('Failed to import save:', error);
    alert(`Failed to import save: ${(error as Error).message}`);
  }

  target.value = '';
};

const downloadSave = (save: SaveData) => {
  try {
    exportSave(save);
  } catch (error) {
    console.error('Failed to download save:', error);
    alert('Failed to download save.');
  }
};

const exportAll = () => {
  try {
    const allSavesData = {
      exportDate: new Date().toISOString(),
      totalSaves: saves.value.length,
      saves: saves.value
    };

    const jsonString = JSON.stringify(allSavesData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-saves-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('All saves exported successfully!');
  } catch (error) {
    console.error('Failed to export all saves:', error);
    alert('Failed to export saves.');
  }
};

const restoreSave = async (save: SaveData) => {
  if (!confirm(`Restore "${save.gameName}" to browser? This will overwrite existing data.`)) {
    return;
  }

  try {
    // Restore localStorage data
    if (save.localStorage) {
      for (const [key, value] of Object.entries(save.localStorage)) {
        try {
          localStorage.setItem(key, value as string);
        } catch (storageError) {
          console.log('Could not restore localStorage item:', key, storageError);
        }
      }
    }

    // Restore IndexedDB data
    if (save.indexedDB) {
      for (const [dbName, stores] of Object.entries(save.indexedDB)) {
        try {
          const request = window.indexedDB.open(dbName);
          
          await new Promise<void>((resolve) => {
            request.onsuccess = () => {
              const db = request.result;
              const storesObj = stores as Record<string, any[]>;
              
              for (const [storeName, items] of Object.entries(storesObj)) {
                try {
                  const transaction = db.transaction(storeName, 'readwrite');
                  const store = transaction.objectStore(storeName);
                  
                  // Clear existing data
                  store.clear();
                  
                  // Add all items from the save
                  for (const item of items) {
                    store.add(item);
                  }
                } catch (storeError) {
                  console.log('Could not restore IndexedDB store:', storeName, storeError);
                }
              }
              
              db.close();
              resolve();
            };
            
            request.onerror = () => {
              console.log('Could not open IndexedDB:', dbName);
              resolve();
            };
          });
        } catch (dbError) {
          console.log('Could not restore IndexedDB:', dbName, dbError);
        }
      }
    }

    alert('Save restored successfully! Reload the page or game to see changes.');
  } catch (error) {
    console.error('Failed to restore save:', error);
    alert('Failed to restore save.');
  }
};

const deleteSaveConfirm = (save: SaveData) => {
  if (confirm(`Delete save "${save.gameName}" from ${new Date(save.timestamp).toLocaleDateString()}?`)) {
    try {
      deleteSave(save.id);
      loadSaves();
      alert('Save deleted.');
    } catch (error) {
      console.error('Failed to delete save:', error);
      alert('Failed to delete save.');
    }
  }
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.save-manager-container {
  width: 100%;
  min-height: 100vh;
  padding: 1.5rem 0;
  background: linear-gradient(135deg, #1e5db8, #5aa5d5, #a8d8ea);
}

.manager-wrapper {
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.5) inset;
}

.manager-header {
  background: linear-gradient(to bottom, #1e5db8 0%, #2875d6 50%, #1a5ba5 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-title h1 {
  margin: 0;
  padding: 0;
  font-size: 1.8rem;
  font-weight: 500;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
}

.save-count {
  margin: 0.3rem 0 0 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.6rem 1.2rem;
  background: rgba(240, 240, 240, 0.9);
  backdrop-filter: blur(8px);
  color: #000;
  border: 1px rgba(153, 153, 153, 0.6);
  border-bottom-color: rgba(102, 102, 102, 0.6);
  border-right-color: rgba(102, 102, 102, 0.6);
  border-radius: 16px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: all 0.1s;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
  outline: none;
}

.action-btn:hover:not(:disabled) {
  background: rgba(248, 248, 248, 0.95);
  backdrop-filter: blur(10px);
  border-color: rgba(30, 93, 184, 0.6);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 20px;
  background: rgba(245, 245, 245, 0.8);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: rgba(30, 93, 184, 0.4);
  background: white;
  box-shadow: 0 0 0 3px rgba(30, 93, 184, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.saves-list {
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.save-card {
  background: rgba(245, 245, 245, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
}

.save-card:hover {
  background: rgba(245, 245, 245, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.save-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.save-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.game-id {
  margin: 0.3rem 0 0 0;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.save-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.7);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  white-space: nowrap;
}

.save-date {
  background: rgba(30, 93, 184, 0.1);
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
}

.save-size {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
}

.save-details {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.detail-badge {
  display: inline-block;
  background: rgba(30, 93, 184, 0.15);
  color: #1e5db8;
  padding: 0.3rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 500;
}

.save-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-small-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  color: #000;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.75rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: all 0.15s;
  outline: none;
}

.action-small-btn:hover {
  background: white;
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.action-small-btn.restore:hover {
  color: #1e5db8;
  border-color: #1e5db8;
}

.action-small-btn.download:hover {
  color: #0d7377;
  border-color: #0d7377;
}

.action-small-btn.delete:hover {
  color: #c41e3a;
  border-color: #c41e3a;
}

.no-saves {
  padding: 3rem 1.5rem;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 1rem;
}

.no-saves p {
  margin: 0;
}

@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title {
    order: 1;
  }

  .header-actions {
    order: 2;
    width: 100%;
  }

  .action-btn {
    flex: 1;
    min-width: 0;
  }

  .save-header {
    flex-direction: column;
  }

  .save-meta {
    width: 100%;
    flex-direction: column;
    gap: 0.25rem;
  }

  .save-actions {
    flex-wrap: wrap;
  }

  .action-small-btn {
    flex: 1;
    min-width: 60px;
  }
}
</style>