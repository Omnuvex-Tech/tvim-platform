import { NextRequest, NextResponse } from "next/server";

type VerifyBody = {
    token?: string;
};

type GoogleVerifyResponse = {
    success?: boolean;
    [key: string]: unknown;
};

const noStoreHeaders = {
    "Cache-Control": "no-store",
};

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const RECAPTCHA_TEST_SECRET_KEY = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

const getClientIp = (request: NextRequest) => {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (!forwardedFor) {
        return "";
    }

    return forwardedFor.split(",")[0]?.trim() ?? "";
};

export async function POST(request: NextRequest) {
    const envSecretKey = (process.env.RECAPTCHA_SECRET_KEY ?? "").trim();
    const secretKey = envSecretKey || (process.env.NODE_ENV !== "production" ? RECAPTCHA_TEST_SECRET_KEY : "");

    if (!secretKey) {
        return NextResponse.json(
            {
                success: false,
                message: "reCAPTCHA secret key tapılmadı.",
            },
            {
                status: 500,
                headers: noStoreHeaders,
            }
        );
    }

    let body: VerifyBody | null = null;

    try {
        body = (await request.json()) as VerifyBody;
    } catch {
        body = null;
    }

    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
        return NextResponse.json(
            {
                success: false,
                message: "reCAPTCHA token tapılmadı.",
            },
            {
                status: 400,
                headers: noStoreHeaders,
            }
        );
    }

    const params = new URLSearchParams({
        secret: secretKey,
        response: token,
    });

    const clientIp = getClientIp(request);
    if (clientIp) {
        params.set("remoteip", clientIp);
    }

    let googleResponse: Response;

    try {
        googleResponse = await fetch(RECAPTCHA_VERIFY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
            cache: "no-store",
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "reCAPTCHA servisinə qoşulmaq mümkün olmadı.",
            },
            {
                status: 502,
                headers: noStoreHeaders,
            }
        );
    }

    let payload: GoogleVerifyResponse | null = null;

    try {
        payload = (await googleResponse.json()) as GoogleVerifyResponse;
    } catch {
        payload = null;
    }

    if (!googleResponse.ok || !payload?.success) {
        return NextResponse.json(
            {
                success: false,
                message: "reCAPTCHA doğrulaması uğursuz oldu.",
            },
            {
                status: 400,
                headers: noStoreHeaders,
            }
        );
    }

    return NextResponse.json(
        {
            success: true,
            message: "reCAPTCHA doğrulandı.",
        },
        {
            headers: noStoreHeaders,
        }
    );
}
