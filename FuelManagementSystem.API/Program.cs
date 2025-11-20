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


// Объявление класса Program
// Уровень доступа - internal (виден в пределах моей сборки)
internal class Program
{
    // Точка входа приложения
    // private -  доступен лишь внутри класса Program
    // static - для вызова не нужен экземпляр класса Program
    // void - без возврата значения
    // string[] args - параметр, содержит аргументы командной строки (переданы при запуске приложения)
    private static void Main(string[] args)
    {
        // Создаём экземляр билдера
        // Для конфигурации и построения приложения
        // args - аргумент командой строки (можно использовать для конфигурации)
        var builder = WebApplication.CreateBuilder(args);

        // Регистрируем (регаем) сервисы (нужны для контроллеров)
        // Позволит использовать контроллеры в приложении
        builder.Services.AddControllers();

        // Регаем сервисы для работы Swagger/OpenAPI с min API (endpoints)
        // Для распознания Swagger-ом конечных точек в приложениях с min API
        builder.Services.AddEndpointsApiExplorer();

        // Добавляем генератор Swagger. Настройка.
        // AddSwaggerGen - метод для реги сервисов
        // Сервисы - для генерации документации Swagger (OpenAI) для API
        // Внутри лямбда-выражения - настройка параметров генерации
        builder.Services.AddSwaggerGen(c =>
        {
            //Создание документа Swagger c:
            // v1 - название версии API (может быть любым, но обычно версия)
            // OpenApiInfo - класс с метаданными API
            //      Title - название API, кот. видно в интерфейсе Swagger UI
            //      Version - версия API
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "Fuel Consumpt API", Version = "v1" });
        });

        // Регаем контекст БД (ApplicationDbContext) в DI-контейнере (Dependency Injection - "внедрение зависимостей")
        // Используем - SQL Server
        // Строка подключения = конфигурация по ключу DefaultConnection
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        // Регаем generic-репозиторий.
        // То есть: запрос IRepository<T> -> для любого типа T - экземпляр Repository<T>
        builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        // Регаем конкретный репозиторий
        // Запрос IFuelColumnRepository -> FuelColumnRepository (область жизни - Scoped)
        builder.Services.AddScoped<IEquipmentRepository, EquipmentRepository>();
        builder.Services.AddScoped<IFuelRepository, FuelRepository>();
        builder.Services.AddScoped<IGeyserRepository, GeyserRepository>();
        builder.Services.AddScoped<IRepairRepository, RepairRepository>();
        builder.Services.AddScoped<IRoleRepository, RoleRepository>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();


        builder.Services.AddAutoMapper(typeof(Program));

        // Добавляем сервисы CORS (Cross-Origin Resource Sharing) в контейнер зависимостей
        // CORS - механизм; позволяет веб-страницам делать запросы к доменам
        // Домены - отличны от домена, с которого они загружены (межсайтовые запросы)
        // Метод = настройка политики CORS для приложения
        builder.Services.AddCors(options =>
        {
            // Создаёт политику CORS с именем AllowAll
            // AllowAll - произвольное имя политики
            // Потом - можно использовать при применении к middleware.
            options.AddPolicy("AllowAll", builder =>
            {
                // Разрешает запросы с любого источника (домена)
                // То есть - любой сайт может сделать запрос к моему API
                // В продакшене - небезопасно
                builder.AllowAnyOrigin()
                // Разрешает все HTTP-методы (GET, POST, PUT, DELETE и т.д.)
                       .AllowAnyMethod()
                // Разрешает все заголовки в запросе
                       .AllowAnyHeader();
            });
        });

        // Конфигурация JWT аутентификации
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

        // Регистрация сервисов авторизации
        builder.Services.AddAuthorization();

        // Создание экземпляра приложения из билдера. (WebApplication)
        // Компиляция всех зареганных сервисов и настройка приложения
        var app = builder.Build();

        // Проверка работы приложения в среде разработке
        // Успех - добавление функционала Swagger
        if (app.Environment.IsDevelopment())
        {
            // Вкл middleware для генерации Swagger-документации в формате JSON
            // middleware будет обрабатывать запросы к /swagger/v.1.0/swagger.json
            app.UseSwagger();
            // Вкл middleware для Swagger UI
            // Предоставляет веб-интерфейс для взаимодействия с API
            // По умолч - доступ по адресу /swagger
            app.UseSwaggerUI();
        }

        // middleware
        // Перенаправка HTTP-запросов на HTTPS
        // Для безопасности
        app.UseHttpsRedirection();

        // Вкл CORS с политикой AllowAll (раннее настроили)
        // Позволяет браузеру выполнять запросы к API
        app.UseCors("AllowAll");

        //
        app.UseStaticFiles();
        //logger.Debug("Static files middleware configured");

        // middleware для аутентификации
        // Идентифицирует пользователя/клиента по учётным данным
        app.UseAuthentication();

        // middleware для авторизации
        // Проверка прав пользователя/клиента
        app.UseAuthorization();

        // Сопоставляет маршруты с контроллерами
        // Для маршрутизации запросов к нужным методам в контроллерах
        app.MapControllers();

        // Запуск приложения
        // Начало прослушивания входящих HTTP-запросов
        app.Run();
    }
}