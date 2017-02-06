

using Microsoft.EntityFrameworkCore;

namespace ConferenceBarrel.Models
{
    public class ApplictionDBContext : DbContext
    {
        public DbSet<Conference> Conferences { get; set;}
        public DbSet<Session> Sessions { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) {

            optionsBuilder.UseSqlite("Filename=./confbarrel.db");
            
        }
    }
}