namespace FuelManagementSystem.API.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmail(string email, string resetToken);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendPasswordResetEmail(string email, string resetToken)
        {
            // Реализация отправки email
            // В реальном приложении используйте SMTP клиент или сервис отправки email

            var resetLink = $"{_configuration["App:BaseUrl"]}/reset-password?token={resetToken}";

            // Заглушка - в реальном приложении здесь будет код отправки email
            Console.WriteLine($"Password reset link for {email}: {resetLink}");

            // Пример с использованием SMTP (раскомментируйте и настройте при необходимости):
            /*
            using var client = new SmtpClient(_configuration["Email:Host"], 
                int.Parse(_configuration["Email:Port"]))
            {
                Credentials = new NetworkCredential(_configuration["Email:Username"], 
                    _configuration["Email:Password"]),
                EnableSsl = true
            };
            
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_configuration["Email:From"]),
                Subject = "Password Reset Request",
                Body = $"Click here to reset your password: {resetLink}",
                IsBodyHtml = true
            };
            mailMessage.To.Add(email);
            
            await client.SendMailAsync(mailMessage);
            */

            await Task.CompletedTask;
        }
    }
}