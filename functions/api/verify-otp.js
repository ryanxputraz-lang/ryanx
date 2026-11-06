
export async function onRequestPost({ request, env }) {

    try {

        const { email, otp } = await request.json();

        if (
            !email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            !/^\d{6}$/.test(String(otp || ""))
        ) {
            return Response.json({
                success: false,
                message: "Email atau OTP tidak valid"
            }, { status: 400 });
        }

        const address = email.trim().toLowerCase();

        const record = await env.DB.prepare(
            "SELECT * FROM email_otps WHERE email = ? ORDER BY id DESC LIMIT 1"
        ).bind(address).first();

        if (!record) {
            return Response.json({
                success: false,
                message: "OTP tidak ditemukan"
            }, { status: 404 });
        }

        if (record.verified_at) {
            return Response.json({
                success: false,
                message: "OTP sudah digunakan"
            }, { status: 400 });
        }

        if (record.attempts >= 5) {
            return Response.json({
                success: false,
                message: "Terlalu banyak percobaan OTP"
            }, { status: 429 });
        }

        if (Date.now() > Date.parse(record.expires_at)) {
            return Response.json({
                success: false,
                message: "OTP sudah kedaluwarsa"
            }, { status: 400 });
        }

        const hash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(String(otp))
        );

        const otpHash = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        if (otpHash !== record.otp_hash) {

            await env.DB.prepare(
                "UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?"
            ).bind(record.id).run();

            return Response.json({
                success: false,
                message: "Kode OTP salah"
            }, { status: 400 });

        }

        const verifiedAt = new Date().toISOString();

        const result = await env.DB.prepare(
            "UPDATE email_otps SET verified_at = ? WHERE id = ? AND verified_at IS NULL AND attempts < 5"
        ).bind(verifiedAt, record.id).run();

        if (result.meta.changes !== 1) {
            return Response.json({
                success: false,
                message: "OTP tidak dapat diverifikasi"
            }, { status: 400 });
        }

        return Response.json({
            success: true,
            message: "Email berhasil diverifikasi"
        });

    } catch (error) {

        return Response.json({
            success: false,
            message: "Terjadi kesalahan server"
        }, { status: 500 });

    }

}
