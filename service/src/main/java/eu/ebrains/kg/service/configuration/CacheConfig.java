package eu.ebrains.kg.service.configuration;


import org.ehcache.jsr107.EhcacheCachingProvider;
import org.springframework.boot.autoconfigure.cache.JCacheManagerCustomizer;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.jcache.JCacheCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.cache.Caching;
import javax.cache.spi.CachingProvider;
import java.net.URISyntaxException;
import java.net.URL;



@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() throws URISyntaxException {
        // Load Ehcache configuration
        CachingProvider provider = Caching.getCachingProvider(EhcacheCachingProvider.class.getName());
        URL url = getClass().getResource("/ehcache.xml");
        javax.cache.CacheManager jCacheManager = provider.getCacheManager(url.toURI(), getClass().getClassLoader());

        // Ehcache-based Cache Manager
        JCacheCacheManager ehcacheManager = new JCacheCacheManager(jCacheManager);

        // In-memory SimpleCacheManager as fallback
        ConcurrentMapCacheManager simpleCacheManager = new ConcurrentMapCacheManager();

        // Composite Cache Manager: Uses Ehcache first, falls back to SimpleCacheManager
        org.springframework.cache.support.CompositeCacheManager compositeCacheManager =
                new org.springframework.cache.support.CompositeCacheManager(ehcacheManager, simpleCacheManager);

        compositeCacheManager.setFallbackToNoOpCache(false); // Ensure we don't disable caching
        return compositeCacheManager;
    }
}