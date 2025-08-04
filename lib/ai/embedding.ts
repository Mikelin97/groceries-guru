import { MilvusClient } from "@zilliz/milvus2-sdk-node";

// Use environment variable for Milvus address, fallback to localhost for development
const address = process.env.MILVUS_URL || "http://localhost:19530";

// Initialize client lazily to avoid build-time connection issues
let client: MilvusClient | null = null;

const getClient = async () => {
  if (!client) {
    try {
      client = new MilvusClient({ address });
      // Test the connection
      await client.checkHealth();
      console.log('✅ Milvus client connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Milvus client:', error);
      throw new Error(`Milvus connection unavailable at ${address}`);
    }
  }
  return client;
};




export const findRelevantContent = async (userQuery: string) => {
    try {
        // Get the Milvus client
        const milvusClient = await getClient();
        
        // Collection name for grocery/FMCG products
        const collectionName = "fmcg_v1"; 

        // Load collection
        await milvusClient.loadCollectionSync({
            collection_name: collectionName,
        });

        // Enhanced search with more relevant fields for grocery products
        const res = await milvusClient.search({
            collection_name: collectionName,
            data: [userQuery],
            anns_field: "content_dense",
            limit: 5, // Increased to get more product options
            output_fields: ["content", "product_name", "brand", "category", "price_range", "rating"], // More grocery-specific fields
            params: {
                "nprobe": 16, // Better search quality
            }
        });

        // Process and format the results for grocery context
        if (res && res.results && res.results.length > 0) {
            const formattedResults = res.results.map((result: any) => {
                return {
                    content: result.content || '',
                    product_name: result.product_name || 'Unknown Product',
                    brand: result.brand || '',
                    category: result.category || '',
                    price_range: result.price_range || '',
                    rating: result.rating || 0,
                    score: result.score || 0
                };
            });

            return {
                success: true,
                results: formattedResults,
                query: userQuery,
                total_results: formattedResults.length
            };
        }

        return {
            success: false,
            results: [],
            query: userQuery,
            message: "No relevant products found in our database."
        };

    } catch (error) {
        console.error('Milvus search error:', error);
        return {
            success: false,
            results: [],
            query: userQuery,
            error: "Unable to search product database at this time."
        };
    }
};