import { createClient, RedisClientType } from 'redis';
import { env } from './env';
import logger from '../utils/logger';

let redisClient: RedisClientType;

export const initializeRedis = async (): Promise<RedisClientType> => {
  redisClient = createClient({
    url: env.REDIS_URL,
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  await redisClient.connect();
  return redisClient;
};

export const getRedis = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis client closed');
  }
};

export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    return await getRedis().get(key);
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

export const cacheSet = async (key: string, value: string, expiresIn?: number): Promise<void> => {
  try {
    if (expiresIn) {
      await getRedis().setEx(key, expiresIn, value);
    } else {
      await getRedis().set(key, value);
    }
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    await getRedis().del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
};

export const cacheFlush = async (): Promise<void> => {
  try {
    await getRedis().flushDb();
    logger.info('Cache flushed');
  } catch (error) {
    logger.error('Cache flush error:', error);
  }
};