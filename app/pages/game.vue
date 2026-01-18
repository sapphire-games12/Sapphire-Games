<template>
  <div class="game-player-container">
    <div class="player-wrapper">
      <!-- Game Header -->
      <div class="game-header">
        <div class="game-title">
          <h2>{{ gameName || 'Game Player' }}</h2>
          <a v-if="gameAuthor" :href="gameAuthorLink" target="_blank" class="game-author">by {{ gameAuthor }}</a>
        </div>
        <div class="game-controls">
          <button @click="fullscreenGame" class="control-btn">⛶ Fullscreen</button>
          <button @click="openInNewWindow" class="control-btn">New Window</button>
          <button @click="downloadGame" class="control-btn">Download</button>

        </div>
      </div>

      <!-- Game Frame -->
      <div class="frame-container"> 
        <iframe
          ref="gameFrame"
          class="game-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-pointer-lock"
        ></iframe>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({
  ssr: false
});

interface Game {
  id: number;
  name: string;
  author?: string;
  authorLink?: string;
  url: string;
  cover: string;
}

const route = useRoute();
const router = useRouter();
const gameFrame = ref<HTMLIFrameElement | null>(null);
const isLoading = ref(true);
const loadingMessage = ref('Loading game...');
const gameName = ref('');
const gameAuthor = ref('');
const gameAuthorLink = ref('');
const currentGame = ref<Game | null>(null);

const zonesURL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json?t=" + Date.now();
const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

let allGames: Game[] = [];

const fullscreenGame = () => {
  if (!gameFrame.value) return;
  
  try {
    if (gameFrame.value.requestFullscreen) {
      gameFrame.value.requestFullscreen();
    } else if ((gameFrame.value as any).mozRequestFullScreen) {
      (gameFrame.value as any).mozRequestFullScreen();
    } else if ((gameFrame.value as any).webkitRequestFullscreen) {
      (gameFrame.value as any).webkitRequestFullscreen();
    } else if ((gameFrame.value as any).msRequestFullscreen) {
      (gameFrame.value as any).msRequestFullscreen();
    }
  } catch (error) {
    console.error('Fullscreen error:', error);
  }
};

const openInNewWindow = () => {
  if (!currentGame.value) return;
  
  const newWindow = window.open("about:blank", "_blank");
  if (!newWindow) return;

  const url = currentGame.value.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
  
  fetch(url + "?t=" + Date.now())
    .then(response => response.text())
    .then(html => {
      if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(html);
        newWindow.document.close();
      }
    })
    .catch(error => console.error('Failed to open in new window:', error));
};

const downloadGame = () => {
  if (!currentGame.value) return;

  const url = currentGame.value.url.replace("{HTML_URL}", htmlURL);
  
  fetch(url + "?t=" + Date.now())
    .then(res => res.text())
    .then(text => {
      const blob = new Blob([text], { type: "text/html;charset=utf-8" });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${currentGame.value!.name}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    })
    .catch(error => console.error('Failed to download game:', error));
};

const closeGame = () => {
  router.back();
};

const loadGameData = async () => {
  try {
    const gameId = route.query.id;
    
    if (!game) {
      loadingMessage.value = 'Game not found.';
      isLoading.value = false;
      return;
    }

    currentGame.value = game;
    gameName.value = game.name;
    gameAuthor.value = game.author || '';
    gameAuthorLink.value = game.authorLink || '#';

    // Load game into iframe
    loadGameInFrame(game);
  } catch (error) {
    console.error('Failed to load game data:', error);
    loadingMessage.value = 'Failed to load game. Please try again.';
    isLoading.value = false;
  }
};

const loadGameInFrame = async (game: Game) => {
  try {
    if (!gameFrame.value) {
      loadingMessage.value = 'Frame not ready. Please try again.';
      isLoading.value = false;
      return;
    }

    const url = game.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    
    loadingMessage.value = 'Loading game...';
    
    const response = await fetch(url + "?t=" + Date.now());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch game: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Write HTML to iframe
    if (gameFrame.value.contentDocument) {
      gameFrame.value.contentDocument.open();
      gameFrame.value.contentDocument.write(html);
      gameFrame.value.contentDocument.close();
    }

    isLoading.value = false;
  } catch (error) {
    console.error('Failed to load game in frame:', error);
    loadingMessage.value = 'Failed to load game. Please try again.';
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadGameData();
});
</script>

<style scoped>
.game-player-container {
  width: 100%;
  height: auto;
  min-height: 600px;
  padding: 1.5rem 0;
}

.player-wrapper {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: rgba(245, 245, 245, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 
              0 2px 8px rgba(0, 0, 0, 0.12),
              0 8px 24px rgba(0, 0, 0, 0.15);
}

.game-header {
  background: linear-gradient(to bottom, #1e5db8 0%, #2875d6 50%, #1a5ba5 100%);
  color: white;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset;
}

.game-title {
  flex: 1;
}

.game-title h2 {
  margin: 0;
  padding: 0;
  font-size: 1.3rem;
  font-weight: 500;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: white;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.3px;
}

.game-author {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 0.8rem;
  margin-top: 0.3rem;
  transition: color 0.15s;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.game-author:hover {
  color: #fff;
}

.game-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.control-btn {
  padding: 0.5rem 1rem;
  background: rgba(240, 240, 240, 0.8);
  backdrop-filter: blur(8px);
  color: #000;
  border: 1px rgba(153, 153, 153, 0.6);
  border-bottom-color: rgba(102, 102, 102, 0.6);
  border-right-color: rgba(102, 102, 102, 0.6);
  border-radius: 16px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: all 0.1s;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
  outline: none;
}

.control-btn:hover {
  background: rgba(248, 248, 248, 0.9);
  backdrop-filter: blur(10px);
  border-color: rgba(30, 93, 184, 0.6);
}

.control-btn:active {
  background: rgba(232, 232, 232, 0.8);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15) inset;
  border-color: rgba(102, 102, 102, 0.6);
}

.frame-container {
  position: relative;
  width: 100%;
  padding-top: 66.67%;
  background: #000;
  border-top: 1px solid #888;
  margin: 0.75rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) inset;
}

.game-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #1e5db8, #2875d6);
  color: white;
  padding: 1.5rem 2.5rem;
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  text-align: center;
  z-index: 10;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.3) inset;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.loading-state p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 400;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.2px;
}

@media (max-width: 768px) {
  .game-player-container {
    padding: 0.75rem 0;
  }

  .player-wrapper {
    max-width: 100%;
    margin: 0 0.5rem;
  }

  .game-header {
    flex-direction: column;
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }

  .game-title h2 {
    font-size: 1.1rem;
  }

  .game-controls {
    width: 100%;
    justify-content: space-between;
    gap: 0.375rem;
  }

  .control-btn {
    flex: 1;
    min-width: 60px;
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
  }

  .frame-container {
    margin: 0.5rem;
  }
}

@media (max-width: 480px) {
  .player-wrapper {
    margin: 0;
  }

  .game-header {
    padding: 0.625rem;
  }

  .control-btn {
    padding: 0.35rem 0.5rem;
    font-size: 0.7rem;
  }
}
</style>
