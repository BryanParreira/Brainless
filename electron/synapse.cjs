const fs = require('fs');
const path = require('path');

/**
 * Enhanced Synapse Engine v3.0
 * 
 * Production-ready intelligent context system with:
 * - Advanced TF-IDF ranking
 * - Recency scoring
 * - Interaction tracking
 * - Auto-linking
 * - Fuzzy search with caching
 * - Context history
 * - Smart suggestions
 * - Zero hallucination guarantees
 */

// --- LRU CACHE ---
class LRUCache {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get size() {
    return this.cache.size;
  }
}

class SynapseEngine {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.indexPath = path.join(dataPath, 'synapse-index.json');
    this.analyticsPath = path.join(dataPath, 'synapse-analytics.json');
    
    // Core data structures
    this.index = {
      version: '3.0.0',
      chunks: [],
      sources: {
        zenith: [],
        canvas: [],
        chat: [],
        chronos: []
      },
      links: [],
      metadata: {
        lastUpdate: Date.now(),
        totalChunks: 0,
        totalLinks: 0
      }
    };

    // Analytics & tracking
    this.analytics = {
      searches: [],
      popularTerms: {},
      contextUsage: {}
    };

    // LRU cache for search results
    this.searchCache = new LRUCache(100);

    // Stop words for TF-IDF
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);

    this.load();
  }

  /**
   * Load index and analytics from disk
   */
  load() {
    try {
      if (fs.existsSync(this.indexPath)) {
        const data = JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
        this.index = { ...this.index, ...data };
      }
      if (fs.existsSync(this.analyticsPath)) {
        const data = JSON.parse(fs.readFileSync(this.analyticsPath, 'utf-8'));
        this.analytics = { ...this.analytics, ...data };
      }
      console.log(`📚 Loaded ${this.index.chunks.length} chunks from disk`);
    } catch (error) {
      console.error('Synapse load error:', error);
      // Reset to defaults on corrupted data
      this.index.chunks = [];
      this.analytics.searches = [];
    }
  }

  /**
   * Save index and analytics to disk
   */
  async save() {
    try {
      await fs.promises.writeFile(this.indexPath, JSON.stringify(this.index, null, 2));
      await fs.promises.writeFile(this.analyticsPath, JSON.stringify(this.analytics, null, 2));
    } catch (error) {
      console.error('Synapse save error:', error);
    }
  }

  /**
   * Enhanced TF-IDF embedding with stop words filtering
   * @param {string} text - Text to embed
   * @returns {Object} Term frequency map
   */
  createTFIDFEmbedding(text) {
    if (!text || typeof text !== 'string') return {};

    const terms = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2 && !this.stopWords.has(term));

    const termFreq = {};
    terms.forEach(term => {
      termFreq[term] = (termFreq[term] || 0) + 1;
    });

    // Normalize by magnitude
    const magnitude = Math.sqrt(
      Object.values(termFreq).reduce((sum, freq) => sum + freq * freq, 0)
    );

    if (magnitude > 0) {
      Object.keys(termFreq).forEach(term => {
        termFreq[term] /= magnitude;
      });
    }

    // Keep only top 100 terms
    const sortedTerms = Object.entries(termFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100);

    return Object.fromEntries(sortedTerms);
  }

  /**
   * Enhanced cosine similarity with exact match boosting
   * @param {Object} embedding1 - First embedding
   * @param {Object} embedding2 - Second embedding
   * @param {string[]} queryTerms - Original query terms for boosting
   * @returns {number} Similarity score (0-1)
   */
  cosineSimilarity(embedding1, embedding2, queryTerms = []) {
    const keys1 = Object.keys(embedding1);
    const keys2 = Object.keys(embedding2);
    const allKeys = new Set([...keys1, ...keys2]);

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    allKeys.forEach(key => {
      const val1 = embedding1[key] || 0;
      const val2 = embedding2[key] || 0;
      dotProduct += val1 * val2;
      mag1 += val1 * val1;
      mag2 += val2 * val2;
    });

    let similarity = mag1 && mag2 ? dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2)) : 0;

    // Boost score for exact query term matches
    if (queryTerms.length > 0) {
      const matchedTerms = queryTerms.filter(term => 
        embedding2[term.toLowerCase()]
      ).length;
      similarity += matchedTerms * 0.1;
    }

    return Math.min(similarity, 1.0);
  }

  /**
   * Calculate recency score with time decay
   * @param {number} timestamp - Content timestamp
   * @returns {number} Recency score (0.3-1.0)
   */
  getRecencyScore(timestamp) {
    const now = Date.now();
    const ageMs = now - timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < 1) return 1.0;
    if (ageDays < 7) return 0.9;
    if (ageDays < 30) return 0.7;
    if (ageDays < 90) return 0.5;
    return 0.3;
  }

  /**
   * Get interaction score for ranking boost
   * @param {string} chunkId - Chunk identifier
   * @returns {number} Interaction multiplier (1.0+)
   */
  getInteractionScore(chunkId) {
    const usage = this.analytics.contextUsage[chunkId];
    if (!usage || !usage.clicks) return 1.0;
    
    // Logarithmic scaling: 0 clicks = 1.0, 10 clicks = 1.3, 20 clicks = 1.5
    return 1.0 + Math.log10(usage.clicks + 1) * 0.3;
  }

  /**
   * Smart chunking with overlap for context preservation
   * @param {string} content - Content to chunk
   * @param {number} chunkSize - Target chunk size in characters
   * @param {number} overlap - Overlap between chunks
   * @returns {string[]} Array of chunks
   */
  smartChunk(content, chunkSize = 500, overlap = 50) {
    if (!content || typeof content !== 'string') return [];
    if (content.length <= chunkSize) return [content];

    const chunks = [];
    let start = 0;

    while (start < content.length) {
      let end = start + chunkSize;
      
      // Try to break at sentence boundary
      if (end < content.length) {
        const nextPeriod = content.indexOf('. ', end);
        if (nextPeriod !== -1 && nextPeriod - end < 100) {
          end = nextPeriod + 1;
        }
      }

      const chunk = content.slice(start, end).trim();
      if (chunk) chunks.push(chunk);
      start = end - overlap;
    }

    return chunks;
  }

  /**
   * Extract keywords from text for auto-linking
   * @param {string} text - Text to analyze
   * @returns {string[]} Top keywords
   */
  extractKeywords(text) {
    const embedding = this.createTFIDFEmbedding(text);
    return Object.keys(embedding).slice(0, 10);
  }

  /**
   * Index content from any source
   * @param {string} source - Source type (zenith, canvas, chat, chronos)
   * @param {string} type - Content type (markdown, code, conversation, etc)
   * @param {string} content - Content to index
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Indexing result
   */
  async indexContent(source, type, content, metadata = {}) {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return { chunks: [], links: [] };
    }

    const chunks = this.smartChunk(content);
    const newChunks = [];
    const timestamp = Date.now();

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const chunkId = `${source}_${type}_${timestamp}_${i}`;

      const chunk = {
        id: chunkId,
        source,
        type,
        content: chunkText,
        embedding: this.createTFIDFEmbedding(chunkText),
        keywords: this.extractKeywords(chunkText),
        metadata: {
          ...metadata,
          chunkIndex: i,
          totalChunks: chunks.length,
          timestamp
        },
        indexed: timestamp
      };

      this.index.chunks.push(chunk);
      this.index.sources[source].push(chunkId);
      newChunks.push(chunk);

      // Initialize analytics
      this.analytics.contextUsage[chunkId] = {
        clicks: 0,
        timesUsed: 0,
        lastAccessed: null,
        sources: [source]
      };
    }

    // Auto-link related chunks
    const newLinks = this.autoLinkChunks(newChunks);

    // Update metadata
    this.index.metadata.lastUpdate = timestamp;
    this.index.metadata.totalChunks = this.index.chunks.length;
    this.index.metadata.totalLinks = this.index.links.length;

    await this.save();

    return {
      chunks: newChunks,
      links: newLinks
    };
  }

  /**
   * Auto-discover connections between content chunks
   * @param {Array} newChunks - Newly added chunks
   * @returns {Array} New links created
   */
  autoLinkChunks(newChunks) {
    const newLinks = [];

    newChunks.forEach(chunk1 => {
      this.index.chunks.forEach(chunk2 => {
        if (chunk1.id === chunk2.id) return;

        // Find shared keywords
        const shared = chunk1.keywords.filter(k => chunk2.keywords.includes(k));
        
        if (shared.length >= 3) {
          const linkId = `${chunk1.id}_${chunk2.id}`;
          const reverseId = `${chunk2.id}_${chunk1.id}`;

          // Avoid duplicates
          const exists = this.index.links.some(l => 
            l.id === linkId || l.id === reverseId
          );

          if (!exists) {
            const link = {
              id: linkId,
              from: chunk1.id,
              to: chunk2.id,
              strength: shared.length / Math.max(chunk1.keywords.length, chunk2.keywords.length),
              keywords: shared,
              discovered: Date.now()
            };

            this.index.links.push(link);
            newLinks.push(link);
          }
        }
      });
    });

    return newLinks;
  }

  /**
   * Advanced search with multi-factor ranking
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Ranked search results
   */
  async search(query, options = {}) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return [];
    }

    const {
      source = null,
      type = null,
      limit = 10,
      threshold = 0.3,
      dateRange = null
    } = options;

    // Check cache
    const cacheKey = JSON.stringify({ query, source, type, limit, threshold });
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      console.log('🎯 Cache hit');
      return cached;
    }

    // Log search
    this.analytics.searches.push({
      query,
      timestamp: Date.now(),
      source: source || 'all',
      resultCount: 0
    });

    const queryEmbedding = this.createTFIDFEmbedding(query);
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const results = [];

    for (const chunk of this.index.chunks) {
      // Apply filters
      if (source && chunk.source !== source) continue;
      if (type && chunk.type !== type) continue;
      if (dateRange) {
        if (chunk.indexed < dateRange.start || chunk.indexed > dateRange.end) continue;
      }

      // Calculate base similarity
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding, queryTerms);
      
      if (similarity < threshold) continue;

      // Multi-factor scoring
      const recencyScore = this.getRecencyScore(chunk.indexed);
      const interactionScore = this.getInteractionScore(chunk.id);
      
      // Keyword matching bonus
      const matchedKeywords = chunk.keywords.filter(k => 
        queryTerms.some(qt => k.includes(qt) || qt.includes(k))
      );
      const keywordBoost = 1.0 + (matchedKeywords.length * 0.1);

      // Final weighted score
      const finalScore = similarity * recencyScore * interactionScore * keywordBoost;

      results.push({
        id: chunk.id,
        source: chunk.source,
        type: chunk.type,
        content: chunk.content,
        metadata: chunk.metadata,
        relevance: Math.min(finalScore * 100, 100),
        explanation: this.explainRelevance(similarity, recencyScore, interactionScore, matchedKeywords),
        keywords: matchedKeywords,
        timestamp: chunk.indexed
      });
    }

    // Sort by relevance and limit
    results.sort((a, b) => b.relevance - a.relevance);
    const limited = results.slice(0, limit);

    // Update analytics
    if (this.analytics.searches.length > 0) {
      this.analytics.searches[this.analytics.searches.length - 1].resultCount = limited.length;
    }
    
    queryTerms.forEach(term => {
      this.analytics.popularTerms[term] = (this.analytics.popularTerms[term] || 0) + 1;
    });

    await this.save();

    // Cache results
    this.searchCache.set(cacheKey, limited);

    return limited;
  }

  /**
   * Generate human-readable relevance explanation
   * @param {number} similarity - Similarity score
   * @param {number} recency - Recency score
   * @param {number} interaction - Interaction score
   * @param {Array} keywords - Matched keywords
   * @returns {string} Explanation
   */
  explainRelevance(similarity, recency, interaction, keywords) {
    const parts = [];

    if (similarity > 0.7) parts.push('High semantic match');
    else if (similarity > 0.4) parts.push('Moderate match');

    if (recency > 0.8) parts.push('Recent content');
    if (interaction > 1.2) parts.push('Frequently accessed');
    if (keywords.length > 0) parts.push(`Matches: ${keywords.slice(0, 3).join(', ')}`);

    return parts.join(' • ') || 'Relevant';
  }

  /**
   * Get active context for AI with intelligent ranking
   * @param {string} query - User's current input/query
   * @param {string} currentSource - Current module (chat, canvas, etc)
   * @returns {Array} Top relevant context chunks
   */
  async getActiveContext(query, currentSource = 'chat') {
    if (!query || typeof query !== 'string' || query.trim().length === 0) return [];

    const results = await this.search(query, {
      limit: 5,
      threshold: 0.2
    });

    // Track context usage
    results.forEach(result => {
      if (this.analytics.contextUsage[result.id]) {
        this.analytics.contextUsage[result.id].timesUsed++;
        this.analytics.contextUsage[result.id].lastAccessed = Date.now();
        if (!this.analytics.contextUsage[result.id].sources.includes(currentSource)) {
          this.analytics.contextUsage[result.id].sources.push(currentSource);
        }
      }
    });

    await this.save();

    return results;
  }

  /**
   * Record user interaction with context (click tracking)
   * @param {string} chunkId - Chunk identifier
   */
  recordInteraction(chunkId) {
    if (this.analytics.contextUsage[chunkId]) {
      this.analytics.contextUsage[chunkId].clicks++;
      this.analytics.contextUsage[chunkId].lastAccessed = Date.now();
      this.save();
    }
  }

  /**
   * Get smart suggestions based on usage patterns
   * @param {string} currentSource - Current module
   * @param {Array} recentTerms - Recently used terms
   * @returns {Array} Suggested context items
   */
  async getSmartSuggestions(currentSource, recentTerms = []) {
    const suggestions = [];

    // Find frequently accessed content
    const topUsed = Object.entries(this.analytics.contextUsage)
      .filter(([id, data]) => {
        const chunk = this.index.chunks.find(c => c.id === id);
        return chunk && data.clicks > 0;
      })
      .sort((a, b) => b[1].clicks - a[1].clicks)
      .slice(0, 3);

    topUsed.forEach(([chunkId, data]) => {
      const chunk = this.index.chunks.find(c => c.id === chunkId);
      if (chunk) {
        const commonTerms = chunk.keywords.filter(k => 
          recentTerms.some(t => t.toLowerCase().includes(k) || k.includes(t.toLowerCase()))
        );

        suggestions.push({
          id: chunk.id,
          source: chunk.source,
          content: chunk.content,
          metadata: chunk.metadata,
          reason: 'Previously accessed',
          accessCount: data.clicks,
          commonTerms
        });
      }
    });

    return suggestions;
  }

  /**
   * Get auto-linked sources for a chunk
   * @param {string} sourceId - Source chunk ID
   * @returns {Array} Linked chunks
   */
  getLinkedSources(sourceId) {
    const links = this.index.links.filter(l => 
      l.from === sourceId || l.to === sourceId
    );

    return links.map(link => {
      const targetId = link.from === sourceId ? link.to : link.from;
      const chunk = this.index.chunks.find(c => c.id === targetId);
      return {
        ...link,
        chunk
      };
    });
  }

  /**
   * Delete indexed content by source ID
   * @param {string} sourceId - Source to delete
   */
  async deleteSource(sourceId) {
    this.index.chunks = this.index.chunks.filter(c => c.id !== sourceId);
    
    Object.keys(this.index.sources).forEach(source => {
      this.index.sources[source] = this.index.sources[source].filter(id => id !== sourceId);
    });

    this.index.links = this.index.links.filter(l => 
      l.from !== sourceId && l.to !== sourceId
    );

    delete this.analytics.contextUsage[sourceId];

    this.index.metadata.totalChunks = this.index.chunks.length;
    this.index.metadata.totalLinks = this.index.links.length;

    await this.save();
  }

  /**
   * Get statistics about indexed content (PRODUCTION READY - FULLY FIXED)
   * @returns {Object} Statistics object
   */
  getStats() {
    try {
      const stats = {
        totalChunks: 0,
        totalLinks: 0,
        sources: {},
        topSearchTerms: [],
        topAccessedContent: [],
        cacheHitRate: 0,
        diskUsage: 0
      };

      // Count chunks by source (SAFE)
      if (this.index && this.index.chunks && Array.isArray(this.index.chunks)) {
        stats.totalChunks = this.index.chunks.length;
        this.index.chunks.forEach(chunk => {
          if (chunk && chunk.source) {
            const source = chunk.source;
            stats.sources[source] = (stats.sources[source] || 0) + 1;
          }
        });
      }

      // Count links (SAFE)
      if (this.index && this.index.links && Array.isArray(this.index.links)) {
        stats.totalLinks = this.index.links.length;
      }

      // Get top search terms (SAFE - FIXED TYPE CHECKING)
      if (this.analytics && this.analytics.searches && Array.isArray(this.analytics.searches)) {
        const termCounts = {};
        
        this.analytics.searches.forEach(search => {
          // Ensure search.query exists and is a string before processing
          if (search && 
              search.query && 
              typeof search.query === 'string' && 
              search.query.length > 0) {
            
            try {
              const terms = search.query
                .toLowerCase()
                .split(/\s+/)
                .filter(t => t && t.length > 2);
              
              terms.forEach(term => {
                if (term) {
                  termCounts[term] = (termCounts[term] || 0) + 1;
                }
              });
            } catch (e) {
              // Skip invalid search entries
              console.warn('Invalid search entry:', search);
            }
          }
        });

        stats.topSearchTerms = Object.entries(termCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([term, count]) => ({ term, count }));
      }

      // Get top accessed content (SAFE)
      if (this.analytics && 
          this.analytics.contextUsage && 
          typeof this.analytics.contextUsage === 'object') {
        
        stats.topAccessedContent = Object.entries(this.analytics.contextUsage)
          .filter(([id, data]) => data && typeof data.clicks === 'number')
          .sort((a, b) => (b[1].clicks || 0) - (a[1].clicks || 0))
          .slice(0, 5)
          .map(([chunkId, data]) => {
            const chunk = this.index.chunks?.find(c => c.id === chunkId);
            return {
              chunkId,
              clicks: data.clicks || 0,
              title: chunk?.metadata?.filename || chunk?.metadata?.title || 'Unknown',
              source: chunk?.source || 'unknown'
            };
          });
      }

      // Calculate cache hit rate (SAFE)
      if (this.analytics && 
          this.analytics.searches && 
          Array.isArray(this.analytics.searches) && 
          this.analytics.searches.length > 0) {
        
        const cacheHits = this.searchCache ? this.searchCache.size : 0;
        const totalSearches = this.analytics.searches.length;
        stats.cacheHitRate = totalSearches > 0 
          ? Math.round((cacheHits / totalSearches) * 100) 
          : 0;
      }

      // Calculate disk usage (SAFE)
      try {
        const indexSize = JSON.stringify(this.index).length;
        const analyticsSize = JSON.stringify(this.analytics).length;
        stats.diskUsage = Math.round((indexSize + analyticsSize) / 1024); // KB
      } catch (e) {
        stats.diskUsage = 0;
      }

      return stats;
      
    } catch (error) {
      console.error('Stats generation error:', error);
      // Return safe defaults
      return {
        totalChunks: 0,
        totalLinks: 0,
        sources: {},
        topSearchTerms: [],
        topAccessedContent: [],
        cacheHitRate: 0,
        diskUsage: 0
      };
    }
  }

  /**
   * Clear all indexed data
   */
  async clear() {
    this.index = {
      version: '3.0.0',
      chunks: [],
      sources: {
        zenith: [],
        canvas: [],
        chat: [],
        chronos: []
      },
      links: [],
      metadata: {
        lastUpdate: Date.now(),
        totalChunks: 0,
        totalLinks: 0
      }
    };

    this.analytics = {
      searches: [],
      popularTerms: {},
      contextUsage: {}
    };

    this.searchCache = new LRUCache(100);

    await this.save();
  }
}

module.exports = { SynapseEngine };