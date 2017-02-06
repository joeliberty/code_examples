namespace ConferenceBarrel.Models
{
    public class Session
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int ConferenceId { get; set; }
        public Conference Conference { get; set; }

    }

}