using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace TalenHuman.API.Hubs
{
    public class TicketHub : Hub
    {
        public async Task JoinTicketRoom(string ticketId, string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, ticketId);
            // Notify others in the room that this user joined
            await Clients.Group(ticketId).SendAsync("UserJoinedRoom", userId);
        }

        public async Task LeaveTicketRoom(string ticketId, string userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ticketId);
            await Clients.Group(ticketId).SendAsync("UserLeftRoom", userId);
        }

        // Broadcast typing status to others in the room
        public async Task Typing(string ticketId, string userId, bool isTyping)
        {
            await Clients.OthersInGroup(ticketId).SendAsync("OnTyping", userId, isTyping);
        }
    }
}
