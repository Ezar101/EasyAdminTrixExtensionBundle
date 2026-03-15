<?php

declare(strict_types=1);

namespace Ezar101\EasyAdminTrixExtensionBundle\Tests\Unit\Config;

use Ezar101\EasyAdminTrixExtensionBundle\Config\Asset;
use ReflectionClass;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class AssetTest extends KernelTestCase
{
    protected function tearDown(): void
    {
        // After each test, the static property $manifest is reset to null.
        // to prevent the state of one test from contaminating the next.
        $reflection = new ReflectionClass(Asset::class);
        $reflection->setStaticPropertyValue('manifest', null);

        parent::tearDown();
    }

    public function testAssetReturnsCleanPathWhenManifestDoesNotContainFile(): void
    {
        // We simulate a manifest that has been loaded but does not contain the file,
        // (or the case where the file did not exist and returned an empty array).
        // By using an empty array [], we prevent the class from reading the actual file on disk.
        $reflection = new ReflectionClass(Asset::class);
        $reflection->setStaticPropertyValue('manifest', []);

        $result = Asset::from('extended-trix.css');

        self::assertSame('bundles/easyadmintrixextension/extended-trix.css', $result);
    }

    public function testAssetUsesManifestWhenAvailable(): void
    {
        // We simulate a loaded manifest by directly injecting an array
        // via Reflection, without having to create a fake physical file.
        $manifestMock = [
            'extended-trix.css' => 'extended-trix.8b7c6d5e.css',
            'extended-trix.js' => 'extended-trix.1a2b3c4d.js',
        ];

        $reflection = new ReflectionClass(Asset::class);
        $reflection->setStaticPropertyValue('manifest', $manifestMock);

        $resultCss = Asset::from('extended-trix.css');
        $resultJs = Asset::from('extended-trix.js');

        self::assertSame('bundles/easyadmintrixextension/extended-trix.8b7c6d5e.css', $resultCss);
        self::assertSame('bundles/easyadmintrixextension/extended-trix.1a2b3c4d.js', $resultJs);
    }

    public function testAssetStripsLeadingDotSlash(): void
    {
        // Sometimes Webpack Encore generates manifests with "./file.css"
        // We check that ltrim($target, './') works correctly.
        $reflection = new ReflectionClass(Asset::class);
        $reflection->setStaticPropertyValue('manifest', [
            'app.css' => './assets/app.1234.css',
        ]);

        $result = Asset::from('app.css');

        self::assertSame('bundles/easyadmintrixextension/assets/app.1234.css', $result);
    }
}
