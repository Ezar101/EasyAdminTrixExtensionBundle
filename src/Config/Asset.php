<?php

declare(strict_types=1);

namespace Ezar101\EasyAdminTrixExtensionBundle\Config;

final class Asset
{
    private static ?array $manifest = null;

    private function __construct()
    {
    }

    public static function from(string $filename): string
    {
        if (self::$manifest === null) {
            $path = __DIR__ . '/../../public/manifest.json';

            if (file_exists($path)) {
                try {
                    $content = file_get_contents($path);
                    self::$manifest = json_decode($content, true, 512, JSON_THROW_ON_ERROR) ?: [];
                } catch (\JsonException $e) {
                    self::$manifest = [];
                }
            } else {
                self::$manifest = [];
            }
        }

        $target = self::$manifest[$filename] ?? $filename;
        $cleanPath = ltrim($target, './');

        return 'bundles/easyadmintrixextension/' . $cleanPath;
    }
}
