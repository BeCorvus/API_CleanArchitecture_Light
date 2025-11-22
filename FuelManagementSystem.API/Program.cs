// Импорт пространства имён (ИПИ)

// ИПИ (Классы для доступа к данным)
// Пример - контекстБД (DbContext)
using FuelManagementSystem.API.Models;

// ИПИ (внутри классы-репозитории)
// Репозитории = абстракция доступа к данным
using FuelManagementSystem.API.Repositories;

// ИПИ (классы для настройки конвейера запросов)
using Microsoft.AspNetCore.Builder;

// ИПИ EF Core (функционал для работы с БД c ORM)
using Microsoft.EntityFrameworkCore;

// ИПИ (для работы с конфигурацией)
// Пример: чтение настроек из appsettings.json
using Microsoft.Extensions.Configuration;

// ИПИ (внедрение зависимостей)
// Здесь - методы для регистрации сервисов (контейнер DI)
using Microsoft.Extensions.DependencyInjection;

// ИПИ (работа с хостингов приложения)
// + настройка среды выполнения (разработка, продакшн)
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;


// ИПИ (работа с Swagger/Swashbuckle)
// Для генерации документации API и UI для тестирования
using Microsoft.OpenApi.Models;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using FuelManagementSystem.API.Services;
using System.Reflection;

using FuelManagementSystem.API.Filters;


// Объявление класса Program
// Уровень доступа - internal (виден в пределах моей сборки)
internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();

        // Database
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        // Repositories
        builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        builder.Services.AddScoped<IEquipmentRepository, EquipmentRepository>();
        builder.Services.AddScoped<IFuelRepository, FuelRepository>();
        builder.Services.AddScoped<IGeyserRepository, GeyserRepository>();
        builder.Services.AddScoped<IRepairRepository, RepairRepository>();
        builder.Services.AddScoped<IRoleRepository, RoleRepository>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();

        // Services
        builder.Services.AddScoped<IJwtService, JwtService>();
        builder.Services.AddScoped<IPasswordService, PasswordService>();
        builder.Services.AddScoped<IEmailService, EmailService>();

        builder.Services.AddAutoMapper(typeof(Program));

        // CORS
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            });
        });

        // JWT Authentication
        var jwtSettings = builder.Configuration.GetSection("Jwt");
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]))
                };
            });

        builder.Services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        });

        // Swagger configuration
        builder.Services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Fuel Management System API",
                Version = "v1",
                Description = "API для системы управления топливом"
            });

            // Изменяем описание для ясности
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "Введите JWT токен. Пример: eyJhbGciOiJIUzI1NiIs...\n\n" +
                             "⚠️ ВАЖНО: Вводите только токен, система добавит 'Bearer ' автоматически",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http, // Изменено с ApiKey на Http
                Scheme = "bearer",
                BearerFormat = "JWT"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });

            // Уберите AutoBearerFilter, если он не работает
            // options.OperationFilter<AutoBearerFilter>();
        });

        var app = builder.Build();

        // CORRECT ORDER OF MIDDLEWARE
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/swagger/v1/swagger.json", "Fuel Management System API v1");
                options.RoutePrefix = "swagger";
                options.DocumentTitle = "Fuel Management System API";
                options.InjectJavascript("/swagger/custom.js");
            });
        }

        app.UseHttpsRedirection();

        // ТОЛЬКО ОДИН РАЗ UseStaticFiles и в правильном порядке
        app.UseStaticFiles(); // ДОЛЖНО БЫТЬ ДО UseSwaggerUI, но т.к. SwaggerUI в условии, оставляем здесь

        app.UseCors("AllowAll");
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}