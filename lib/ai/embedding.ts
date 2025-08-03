import { MilvusClient, } from "@zilliz/milvus2-sdk-node";


const address = "http://localhost:19530";

// connect to milvus
const client = new MilvusClient({address});




export const findRelevantContent = async (userQuery: string) => {
    try {
        // Collection name for grocery/FMCG products
        const collectionName = "fmcg_v1"; 

        // Load collection
        await client.loadCollectionSync({
            collection_name: collectionName,
        });

        // Enhanced search with more relevant fields for grocery products
        const res = await client.search({
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