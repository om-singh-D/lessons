// Redis client for websocket session management
let redisClient = null;

// Simple in-memory fallback for development
const memoryStore = new Map();

export async function initRedis() {
  if (process.env.REDIS_URL) {
    try {
      // Dynamic import for Redis (only if REDIS_URL is provided)
      const { createClient } = await import('redis');
      
      redisClient = createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis retry attempts exhausted');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        redisClient = null; // Fall back to memory store
      });

      redisClient.on('connect', () => {
        console.log('Connected to Redis');
      });

      redisClient.on('reconnecting', () => {
        console.log('Reconnecting to Redis...');
      });

      await redisClient.connect();
      return redisClient;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      redisClient = null;
      return null;
    }
  } else {
    console.log('No Redis URL provided, using in-memory store');
    return null;
  }
}

export async function setData(key, value, expireInSeconds = 3600) {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(key, expireInSeconds, JSON.stringify(value));
    } else {
      // Fallback to memory store
      memoryStore.set(key, {
        value,
        expireAt: Date.now() + (expireInSeconds * 1000)
      });
      
      // Clean up expired entries
      setTimeout(() => {
        const entry = memoryStore.get(key);
        if (entry && Date.now() > entry.expireAt) {
          memoryStore.delete(key);
        }
      }, expireInSeconds * 1000);
    }
  } catch (error) {
    console.error('Error setting data:', error);
    // Fallback to memory store
    memoryStore.set(key, {
      value,
      expireAt: Date.now() + (expireInSeconds * 1000)
    });
  }
}

export async function getData(key) {
  try {
    if (redisClient && redisClient.isOpen) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback to memory store
      const entry = memoryStore.get(key);
      if (entry) {
        if (Date.now() > entry.expireAt) {
          memoryStore.delete(key);
          return null;
        }
        return entry.value;
      }
      return null;
    }
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
}

export async function deleteData(key) {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.del(key);
    } else {
      memoryStore.delete(key);
    }
  } catch (error) {
    console.error('Error deleting data:', error);
    memoryStore.delete(key);
  }
}

export async function incrementData(key, increment = 1) {
  try {
    if (redisClient && redisClient.isOpen) {
      return await redisClient.incrBy(key, increment);
    } else {
      const current = await getData(key) || 0;
      const newValue = current + increment;
      await setData(key, newValue);
      return newValue;
    }
  } catch (error) {
    console.error('Error incrementing data:', error);
    return 0;
  }
}

export async function addToSet(key, member, expireInSeconds = 3600) {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.sAdd(key, member);
      await redisClient.expire(key, expireInSeconds);
    } else {
      const currentSet = await getData(key) || [];
      if (!currentSet.includes(member)) {
        currentSet.push(member);
        await setData(key, currentSet, expireInSeconds);
      }
    }
  } catch (error) {
    console.error('Error adding to set:', error);
  }
}

export async function getSetMembers(key) {
  try {
    if (redisClient && redisClient.isOpen) {
      return await redisClient.sMembers(key);
    } else {
      return await getData(key) || [];
    }
  } catch (error) {
    console.error('Error getting set members:', error);
    return [];
  }
}

export async function removeFromSet(key, member) {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.sRem(key, member);
    } else {
      const currentSet = await getData(key) || [];
      const newSet = currentSet.filter(item => item !== member);
      await setData(key, newSet);
    }
  } catch (error) {
    console.error('Error removing from set:', error);
  }
}

export function getRedisClient() {
  return redisClient;
}

export function getMemoryStore() {
  return memoryStore;
}
