
export async function onRequestGet({ env }) {

    const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    ).all();

    return Response.json({
        success: true,
        message: "Database RYANX terhubung!",
        tables: result.results
    });

}
