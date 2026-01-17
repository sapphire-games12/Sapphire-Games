<template>
  <div class="games-container">
    <!-- Controls Section -->
    <div class="controls-section">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search games..."
        class="search-input"
      />
      <select v-model="sortBy" @change="sortGames" class="sort-select">
        <option value="name">Name</option>
        <option value="id">ID (Date)</option>
        <option value="popular">Popular</option>
      </select>
    </div>

    <!-- Game Count -->
    <div class="game-count">{{ filteredGames.length }} games found</div>

    <!-- Games Grid -->
    <div class="games-grid">
      <NuxtLink
        v-for="game in filteredGames"
        :key="game.id"
        :to="`/game?id=${game.id}`"
        class="game-card"
      >
        <div class="game-cover">
          <img :src="game.cover" :alt="game.name" loading="lazy" />
        </div>
        <div class="game-info">
          <h3>{{ game.name }}</h3>
          <p class="game-author">{{ game.author }}</p>
        </div>
      </NuxtLink>
    </div>

    <!-- No Games Message -->
    <div v-if="filteredGames.length === 0" class="no-games">
      <p>No games found matching your search.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';

interface Game {
  id: number;
  name: string;
  cover: string;
  url: string;
  author: string;
  authorLink?: string;
}

definePageMeta({
  ssr: false
});

const games = ref<Game[]>([]);
const searchQuery = ref('');
const sortBy = ref('name');

const zonesURL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json?t=" + Date.now();
const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

let allGames: Game[] = [];
let popularityData: Record<number, number> = {};

const filteredGames = computed(() => {
  let filtered = games.value.filter(game =>
    game.id !== 596 && game.id !== -1 &&
    game.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  if (sortBy.value === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy.value === 'id') {
    filtered.sort((a, b) => a.id - b.id);
  } else if (sortBy.value === 'popular') {
    filtered.sort((a, b) => (popularityData[b.id] || 0) - (popularityData[a.id] || 0));
  }

  return filtered;
});

const sortGames = () => {
  // Trigger computed property update
  games.value = [...games.value];
};

const fetchPopularity = async () => {
  try {
    const response = await fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main/files?period=year");
    const data = await response.json();
    data.forEach((file: any) => {
      const idMatch = file.name.match(/\/(\d+)\.html$/);
      if (idMatch) {
        const id = parseInt(idMatch[1]);
        popularityData[id] = file.hits.total;
      }
    });
  } catch (error) {
    console.error('Failed to fetch popularity:', error);
  }
};

onMounted(async () => {
  try {
    const response = await fetch(zonesURL);
    const data = await response.json();
    
    games.value = data.map((game: any) => ({
      ...game,
      cover: game.cover.replace("{COVER_URL}", coverURL),
      url: game.url.replace("{HTML_URL}", htmlURL)
    }));

    await fetchPopularity();
  } catch (error) {
    console.error('Failed to load games:', error);
  }
});
</script>

<style scoped>
.games-container {
  width: 100%;
  padding: 1rem 0;
}

/* Controls Section */
.controls-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: rgba(30, 93, 184, 0.6);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(30, 93, 184, 0.15);
}

.search-input::placeholder {
  color: rgba(153, 153, 153, 0.7);
}

.sort-select {
  padding: 0.75rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  outline: none;
  transition: border-color 0.2s;
  color: #333;
}

.sort-select:focus {
  border-color: rgba(30, 93, 184, 0.6);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.sort-select option {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: #333;
  padding: 0.5rem;
}

/* Game Count */
.game-count {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Games Grid */
.games-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  padding: 0 0 1rem 0;
}

.game-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
  cursor: pointer;
}

.game-card:hover {
  transform: translateY(-4px);
  border-color: rgba(30, 93, 184, 0.4);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 16px rgba(30, 93, 184, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.game-card:active {
  transform: translateY(-2px);
}

.game-cover {
  width: 100%;
  padding-top: 100%;
  position: relative;
  background: linear-gradient(135deg, #f0f0f0, #e5e5e5);
  overflow: hidden;
}

.game-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .game-cover img {
  transform: scale(1.05);
}

.game-info {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: white;
}

.game-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e5db8;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.3;
}

.game-author {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* No Games Message */
.no-games {
  padding: 3rem 1rem;
  text-align: center;
  color: #888;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.no-games p {
  margin: 0;
  font-size: 1.1rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .games-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }

  .controls-section {
    flex-wrap: wrap;
  }

  .sort-select {
    flex: 1;
    min-width: 150px;
  }
}

@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .controls-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .sort-select {
    width: 100%;
  }

  .game-info {
    padding: 0.75rem;
  }

  .game-info h3 {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .games-grid {
    grid-template-columns: 1fr;
  }

  .controls-section {
    padding: 0.75rem;
  }

  .search-input,
  .sort-select {
    padding: 0.625rem;
    font-size: 0.9rem;
  }

  .game-info {
    padding: 0.625rem;
  }
}
</style>