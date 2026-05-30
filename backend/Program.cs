using System.Text;
using backend.Data.Generated;
using backend.Repositories.Admin;
using backend.Repositories.Student;
using backend.Services.Admin;
using backend.Services.AI;
using backend.Services.Auth;
using backend.Services.Student;
using backend.Services.Guest;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

#region Services

// Controllers
builder.Services.AddControllers();

// Swagger (بديل AddOpenApi)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowAnyOrigin(); // أسهل حل للـ Render
    });
});

// DbContext (PostgreSQL - Neon)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

#endregion

#region Admin Services
builder.Services.AddScoped<IAdminDashboardRepository, AdminDashboardRepository>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();

builder.Services.AddScoped<IAdminSubjectsRepository, AdminSubjectsRepository>();
builder.Services.AddScoped<IAdminSubjectsService, AdminSubjectsService>();

builder.Services.AddScoped<IAdminLessonsRepository, AdminLessonsRepository>();
builder.Services.AddScoped<IAdminLessonsService, AdminLessonsService>();

builder.Services.AddScoped<IAdminExamsRepository, AdminExamsRepository>();
builder.Services.AddScoped<IAdminExamsService, AdminExamsService>();

builder.Services.AddScoped<IAdminAnalyticsRepository, AdminAnalyticsRepository>();
builder.Services.AddScoped<IAdminAnalyticsService, AdminAnalyticsService>();

builder.Services.AddScoped<IAdminUsersRepository, AdminUsersRepository>();
builder.Services.AddScoped<IAdminUsersService, AdminUsersService>();

builder.Services.AddScoped<IAdminAchievementsRepository, AdminAchievementsRepository>();
builder.Services.AddScoped<IAdminAchievementsService, AdminAchievementsService>();
#endregion

#region Auth Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IPasswordValidator, PasswordValidator>();
builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
#endregion

#region Student Services
builder.Services.AddScoped<IStudentSetupService, StudentSetupService>();
builder.Services.AddScoped<IStudentSetupRepository, StudentSetupRepository>();

builder.Services.AddScoped<IStudentDashboardRepository, StudentDashboardRepository>();
builder.Services.AddScoped<IStudentDashboardService, StudentDashboardService>();

builder.Services.AddScoped<ProgressService>();

builder.Services.AddHttpClient<IAiInsightsService, FlaskAiInsightsService>();
builder.Services.AddHttpClient<ISubjectChatbotService, FlaskSubjectChatbotService>();

builder.Services.AddScoped<IStudentSubjectRepository, StudentSubjectRepository>();
builder.Services.AddScoped<IStudentSubjectService, StudentSubjectService>();

builder.Services.AddScoped<IStudentExamRepository, StudentExamRepository>();
builder.Services.AddScoped<IStudentExamService, StudentExamService>();

builder.Services.AddScoped<IStudentAnalyticsRepository, StudentAnalyticsRepository>();
builder.Services.AddScoped<IStudentAnalyticsService, StudentAnalyticsService>();

builder.Services.AddScoped<IStudentAchievementRepository, StudentAchievementRepository>();
builder.Services.AddScoped<IStudentAchievementService, StudentAchievementService>();

builder.Services.AddScoped<IStudentProfileRepository, StudentProfileRepository>();
builder.Services.AddScoped<IStudentProfileService, StudentProfileService>();

builder.Services.AddScoped<IStudentStudyPlanRepository, StudentStudyPlanRepository>();
builder.Services.AddScoped<IStudentStudyPlanService, StudentStudyPlanService>();

builder.Services.AddScoped<IAdminProfileRepository, AdminProfileRepository>();
builder.Services.AddScoped<IAdminProfileService, AdminProfileService>();
#endregion

#region JWT
var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Jwt:Key is missing");

if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Jwt:Key must be at least 32 bytes");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();
#endregion

var app = builder.Build();

#region Middleware Pipeline

app.UseRouting();

// CORS
app.UseCors("FrontendPolicy");

// Auth
app.UseAuthentication();
app.UseAuthorization();

// Swagger (Production + Development)
app.UseSwagger();
app.UseSwaggerUI();

// Controllers
app.MapControllers();

#endregion

app.Run();