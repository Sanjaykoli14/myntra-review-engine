$port = 8080
$root = $PSScriptRoot

# Read GROQ_API_KEY from .env if present
$envPath = Join-Path $root ".env"
$groqApiKey = ""
$groqModel = "openai/gpt-oss-120b"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    foreach ($line in $envContent) {
        if ($line -match "^GROQ_API_KEY\s*=\s*(.+)$") {
            $groqApiKey = $matches[1].Trim()
        }
        if ($line -match "^GROQ_MODEL\s*=\s*(.+)$") {
            $groqModel = $matches[1].Trim()
        }
    }
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "======================================================="
    Write-Host "  Myntra Review & Discovery Engine Server Running"
    Write-Host "  URL: $prefix"
    Write-Host "  Root: $root"
    if ($groqApiKey) {
        Write-Host "  Groq API Proxy: ENABLED ($groqModel)"
    } else {
        Write-Host "  Groq API Proxy: Local Fallback Engine"
    }
    Write-Host "  Press Ctrl+C to stop the server"
    Write-Host "======================================================="
} catch {
    Write-Error "Failed to start HttpListener on $prefix : $_"
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".csv"  = "text/csv; charset=utf-8"
    ".txt"  = "text/plain; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)

        # Handle /api/chat Proxy Route
        if ($urlPath -eq "/api/chat") {
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 200
                $response.Close()
                continue
            }

            if ($request.HttpMethod -eq "POST" -and $groqApiKey) {
                try {
                    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                    $reqBody = $reader.ReadToEnd()
                    $reqJson = $reqBody | ConvertFrom-Json

                    $systemPrompt = "You are the 'Myntra Review & Discovery Engine AI', an expert fashion e-commerce Product Analyst and Discovery Specialist. Analyze customer reviews in 'Docs/reviews.csv' to identify why users save products to their Wishlist but do not purchase them, and recommend high-impact product solutions to increase 30-day wishlist-to-purchase conversions. Return ONLY valid JSON adhering strictly to: { direct_answer: string, identified_themes: [{name: string, frequency_pct: number, severity: string, rationale: string}], evidence_quotes: [{quote: string, source: string, rating: number, date: string, theme: string}], opportunity_analysis: {primary_barrier: string, conversion_impact_score: number, recommended_actions: [string]} }."
                    $userContent = "USER DISCOVERY QUESTION: `"$($reqJson.query)`"`n`n$($reqJson.contextPayload.contextText)`n`nGenerate the structured JSON analysis."

                    $groqPayload = @{
                        model = $groqModel
                        messages = @(
                            @{ role = "system"; content = $systemPrompt },
                            @{ role = "user"; content = $userContent }
                        )
                        response_format = @{ type = "json_object" }
                        temperature = 0.15
                        max_tokens = 2000
                    } | ConvertTo-Json -Depth 6

                    $headers = @{
                        "Authorization" = "Bearer $groqApiKey"
                        "Content-Type" = "application/json"
                    }

                    $groqRes = Invoke-RestMethod -Uri "https://api.groq.com/openai/v1/chat/completions" -Method Post -Headers $headers -Body $groqPayload
                    $contentStr = $groqRes.choices[0].message.content

                    $response.ContentType = "application/json; charset=utf-8"
                    $response.StatusCode = 200
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($contentStr)
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                } catch {
                    $response.ContentType = "application/json"
                    $response.StatusCode = 500
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes("{`"error`":`"$($_.Exception.Message)`", `"fallback_needed`":true}")
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }
            } else {
                $response.ContentType = "application/json"
                $response.StatusCode = 401
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("{`"error`":`"No GROQ_API_KEY configured`", `"fallback_needed`":true}")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
        }

        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/index.html"
        }

        # Normalize file path
        $relativePath = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = [System.IO.Path]::Combine($root, $relativePath)
        $fullPath = [System.IO.Path]::GetFullPath($filePath)

        # Security check: ensure path is within root
        if (-not $fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if (Test-Path -Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) {
                $mime = "application/octet-stream"
            }

            $response.ContentType = $mime
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.StatusCode = 200

            $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentLength64 = $fileBytes.Length
            $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
        } else {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }

        $response.Close()
    } catch {
        # Catch connection resets or aborted requests gracefully
    }
}
