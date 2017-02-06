using System.Collections.Generic;

namespace ConferenceBarrel.Models
{
    public class Conference
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal TicketPrice { get; set; }
        public List<Session> Sessions { get; set; }
    }
}