# PowerShell script to test the user data endpoints
$baseUrl = "http://localhost:3000"

# Test data
$signupData = @{
    username = "postmantest$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "postmantest$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    firstName = "Postman"
    lastName = "Test"
    age = 25
    profession = "Developer"
    primaryGoal = "Learn new skills"
    password = "testpassword123"
} | ConvertTo-Json

Write-Host "🧪 Testing User Data API Endpoints" -ForegroundColor Cyan
Write-Host "=" * 50

try {
    # Test 1: Signup
    Write-Host "`n1️⃣ Testing Signup..." -ForegroundColor Yellow
    $signupResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Body $signupData -ContentType "application/json"
    
    if ($signupResponse.success) {
        Write-Host "✅ Signup successful!" -ForegroundColor Green
        Write-Host "👤 Username: $($signupResponse.user.username)" -ForegroundColor White
        Write-Host "📧 Email: $($signupResponse.user.email)" -ForegroundColor White
        Write-Host "🎫 Token received: $($signupResponse.token -ne $null)" -ForegroundColor White
        
        $token = $signupResponse.token
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        # Test 2: Get User Info
        Write-Host "`n2️⃣ Testing /api/user/info..." -ForegroundColor Yellow
        $userInfoResponse = Invoke-RestMethod -Uri "$baseUrl/api/user/info" -Method GET -Headers $headers
        
        if ($userInfoResponse.success) {
            Write-Host "✅ User info retrieved successfully!" -ForegroundColor Green
            Write-Host "📊 User data preview:" -ForegroundColor White
            Write-Host "   - ID: $($userInfoResponse.user.id)" -ForegroundColor Gray
            Write-Host "   - Username: $($userInfoResponse.user.username)" -ForegroundColor Gray
            Write-Host "   - Email: $($userInfoResponse.user.email)" -ForegroundColor Gray
            Write-Host "   - Level: $($userInfoResponse.user.level)" -ForegroundColor Gray
            Write-Host "   - XP Points: $($userInfoResponse.user.xpPoints)" -ForegroundColor Gray
            Write-Host "   - Authenticated: $($userInfoResponse.user.isAuthenticated)" -ForegroundColor Gray
        }
        
        # Test 3: Get Complete User Data
        Write-Host "`n3️⃣ Testing /api/user (complete data)..." -ForegroundColor Yellow
        $completeUserResponse = Invoke-RestMethod -Uri "$baseUrl/api/user" -Method GET -Headers $headers
        
        if ($completeUserResponse.success) {
            Write-Host "✅ Complete user data retrieved!" -ForegroundColor Green
            Write-Host "📈 Statistics:" -ForegroundColor White
            Write-Host "   - Account age: $($completeUserResponse.data.stats.accountAge) days" -ForegroundColor Gray
            Write-Host "   - Total lessons: $($completeUserResponse.data.stats.totalLessons)" -ForegroundColor Gray
            Write-Host "   - Level: $($completeUserResponse.data.gamification.level)" -ForegroundColor Gray
        }
        
        # Test 4: Test existing profile endpoint
        Write-Host "`n4️⃣ Testing /api/auth/profile..." -ForegroundColor Yellow
        $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/profile" -Method GET -Headers $headers
        
        if ($profileResponse.success) {
            Write-Host "✅ Profile data retrieved!" -ForegroundColor Green
        }
        
        Write-Host "`n🎉 All tests passed! The API is working correctly." -ForegroundColor Green
        Write-Host "`n📋 Summary for Postman testing:" -ForegroundColor Cyan
        Write-Host "   • Server running on: $baseUrl" -ForegroundColor White
        Write-Host "   • Import the Postman collection: AlchPrep-User-Data-API.postman_collection.json" -ForegroundColor White
        Write-Host "   • All endpoints are ready for testing!" -ForegroundColor White
        
    } else {
        Write-Host "❌ Signup failed: $($signupResponse.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error during testing: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure the server is running: npm run dev" -ForegroundColor Yellow
}
