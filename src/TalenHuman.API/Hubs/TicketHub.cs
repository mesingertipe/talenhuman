using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace TalenHuman.API.Hubs
{
    public class TicketHub : Hub
    {
        // Clients can call this to join a specific ticket room
        public async Task JoinTicketRoom(string ticketId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, ticketId);
        }

        // Clients can call this to leave a ticket room
        public async Task LeaveTicketRoom(string ticketId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ticketId);
        }
    }
}
