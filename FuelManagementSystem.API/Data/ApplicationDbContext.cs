using FuelManagementSystem.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FuelManagementSystem.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<FuelColumn> FuelColumns { get; set; }
        public DbSet<Repair> Repairs { get; set; }
        public DbSet<Fuel> Fuels { get; set; }
        public DbSet<Nozzle> Nozzles { get; set; }
        public DbSet<Equipment> Equipment { get; set; }
        public DbSet<ColumnEquipment> ColumnEquipments { get; set; }
        public DbSet<ColumnRepair> ColumnRepairs { get; set; }
        public DbSet<NozzleRepair> NozzleRepairs { get; set; }
        public DbSet<EquipmentRepair> EquipmentRepairs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Настройка связей между таблицами
            modelBuilder.Entity<FuelColumn>()
                .HasMany(c => c.Nozzles)
                .WithOne(n => n.FuelColumn)
                .HasForeignKey(n => n.ID_Column);

            modelBuilder.Entity<Fuel>()
                .HasMany(f => f.Nozzles)
                .WithOne(n => n.Fuel)
                .HasForeignKey(n => n.ID_Fuel);

            // Настройка SoftDelete для всех сущностей
            modelBuilder.Entity<FuelColumn>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Repair>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Fuel>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Nozzle>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<Equipment>().HasQueryFilter(e => !e.IsDeleted);
        }

        public override int SaveChanges()
        {
            UpdateAuditFields();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateAuditFields();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateAuditFields()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

            string currentUser = "System"; // В реальном приложении здесь будет текущий пользователь

            foreach (var entry in entries)
            {
                var entity = (BaseEntity)entry.Entity;

                if (entry.State == EntityState.Added)
                {
                    entity.CreatedDate = DateTime.Now;
                    entity.CreatedBy = currentUser;
                }

                entity.ModifiedDate = DateTime.Now;
                entity.ModifiedBy = currentUser;
            }
        }
    }
}