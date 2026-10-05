/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: HubIdGenerator.cs
 * Purpose: Provide safe generation and validation for public station HubId identifiers.
 */

using System.Text.RegularExpressions;

namespace SmartSolarMicrogrid.Api.Common.Utilities;

public static class HubIdGenerator
{
    public const string HubIdPattern = @"^HUB-[A-Z0-9]{8}$";

    private static readonly Regex HubIdRegex = new(
        HubIdPattern,
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>
    /// Generates a new collision-resistant HubId in the format HUB-XXXXXXXX.
    /// Uses 8 uppercase hexadecimal characters derived from a cryptographically strong GUID.
    /// </summary>
    public static string Generate()
    {
        // Generate a collision-resistant HubId in HUB-XXXXXXXX format.
        return $"HUB-{Guid.NewGuid():N}"[..12].ToUpperInvariant();
    }

    /// <summary>
    /// Verifies whether the provided string matches the expected HUB-XXXXXXXX format.
    /// </summary>
    public static bool IsValid(string? hubId)
    {
        // Verify that the hubId matches the required HUB-XXXXXXXX pattern.
        if (string.IsNullOrWhiteSpace(hubId))
        {
            return false;
        }

        return HubIdRegex.IsMatch(hubId.Trim());
    }
}
