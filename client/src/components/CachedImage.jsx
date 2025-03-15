import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Global cache to store image URIs and their cached paths
const imageCache = new Map();

export default function CachedImage({ source, style, onLoad, ...props }) {
  const [cachedSource, setCachedSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      // If no source or no URI, just use the original source
      if (!source || !source.uri) {
        setCachedSource(source);
        setIsLoading(false);
        return;
      }

      try {
        // Check if this image is already in our cache
        if (imageCache.has(source.uri)) {
          // Use the cached version
          setCachedSource({ uri: imageCache.get(source.uri) });
          setIsLoading(false);
          return;
        }

        // Create a unique filename for caching
        const filename = source.uri.split('/').pop();
        const cacheFilePath = `${FileSystem.cacheDirectory}${filename}`;

        // Check if the file already exists in the cache
        const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
        
        if (fileInfo.exists) {
          // File exists in cache, use it
          imageCache.set(source.uri, cacheFilePath);
          setCachedSource({ uri: cacheFilePath });
          setIsLoading(false);
        } else {
          // Download the image to cache
          const downloadResult = await FileSystem.downloadAsync(
            source.uri,
            cacheFilePath
          );
          
          if (downloadResult.status === 200) {
            imageCache.set(source.uri, cacheFilePath);
            setCachedSource({ uri: cacheFilePath });
          } else {
            // If download fails, fall back to original source
            setCachedSource(source);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('Error caching image:', error);
        // On error, fall back to the original source
        setCachedSource(source);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [source?.uri]);

  // Handle the onLoad event
  const handleImageLoad = () => {
    if (onLoad) {
      onLoad();
    }
  };

  // If still loading and no cached source yet, return null or a placeholder
  if (isLoading && !cachedSource) {
    return null;
  }

  return (
    <Image
      source={cachedSource || source}
      style={style}
      onLoad={handleImageLoad}
      {...props}
    />
  );
} 