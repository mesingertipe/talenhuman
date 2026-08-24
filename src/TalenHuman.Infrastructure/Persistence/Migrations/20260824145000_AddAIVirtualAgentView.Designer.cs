using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TalenHuman.Infrastructure.Persistence;

#nullable disable

namespace TalenHuman.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260824145000_AddAIVirtualAgentView")]
    partial class AddAIVirtualAgentView
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            // No model changes, only raw SQL view
#pragma warning restore 612, 618
        }
    }
}
