using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Data;

public static class CartSchemaUpdater
{
    public static async Task ApplyAsync(EcommerceWebDbContext context, CancellationToken cancellationToken = default)
    {
        // Braces must be doubled — ExecuteSqlRaw treats { } as format placeholders.
        await context.Database.ExecuteSqlRawAsync(
            """
            IF COL_LENGTH('dbo.CartItems', 'SelectedAttributes') IS NULL
            BEGIN
                ALTER TABLE dbo.CartItems
                    ADD SelectedAttributes NVARCHAR(MAX) NOT NULL
                        CONSTRAINT DF_CartItems_SelectedAttributes DEFAULT ('{{}}');
            END
            """,
            cancellationToken);

        await context.Database.ExecuteSqlRawAsync(
            """
            IF EXISTS (
                SELECT 1
                FROM sys.indexes
                WHERE name = N'UQ_CartItems_User_Product'
                  AND object_id = OBJECT_ID(N'dbo.CartItems')
            )
            BEGIN
                ALTER TABLE dbo.CartItems DROP CONSTRAINT UQ_CartItems_User_Product;
            END
            """,
            cancellationToken);

        await context.Database.ExecuteSqlRawAsync(
            """
            IF COL_LENGTH('dbo.CartItems', 'SelectedAttributes') IS NOT NULL
            BEGIN
                UPDATE dbo.CartItems
                SET SelectedAttributes = '{{}}'
                WHERE SelectedAttributes IS NULL OR LTRIM(RTRIM(SelectedAttributes)) = '';
            END
            """,
            cancellationToken);
    }
}
