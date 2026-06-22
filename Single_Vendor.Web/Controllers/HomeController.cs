using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Single_Vendor.Web.Models;

namespace Single_Vendor.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IWebHostEnvironment _env;

        public HomeController(ILogger<HomeController> logger, IWebHostEnvironment env)
        {
            _logger = logger;
            _env = env;
        }

        /// <summary>Serves the React SPA from wwwroot (built by Single_Vendor.Web.csproj).</summary>
        public IActionResult Index()
        {
            var path = Path.Combine(_env.WebRootPath ?? "", "index.html");
            if (!System.IO.File.Exists(path))
            {
                _logger.LogWarning("wwwroot/index.html missing. Build the solution so npm run build copies the React app into wwwroot.");
                return Content(
                    "The React app is not in wwwroot. From the repo root, run: dotnet build Single_Vendor.Web (requires npm install in Single_Vendor.Client), " +
                    "or use: dotnet build -p:SkipSpaBuild=true and copy Single_Vendor.Client/build/* into wwwroot manually.",
                    "text/plain",
                    System.Text.Encoding.UTF8);
            }

            return PhysicalFile(path, "text/html");
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
