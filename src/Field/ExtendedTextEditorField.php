<?php

declare(strict_types=1);

namespace Ezar101\EasyAdminTrixExtensionBundle\Field;

use EasyCorp\Bundle\EasyAdminBundle\Contracts\Field\FieldInterface;
use EasyCorp\Bundle\EasyAdminBundle\Field\FieldTrait;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use Symfony\Component\Asset\PathPackage;
use Symfony\Component\Asset\VersionStrategy\JsonManifestVersionStrategy;
use Symfony\Contracts\Translation\TranslatableInterface;

final class ExtendedTextEditorField implements FieldInterface
{
    use FieldTrait;

    public static function new(string $propertyName, TranslatableInterface|bool|string|null $label = null): TextEditorField
    {
        $customConfig = [
            'blockAttributes' => [
                'default' => ['tagName' => 'p', 'parse' => false],
                'heading2' => ['tagName' => 'h2', 'terminal' => true, 'breakOnReturn' => true, 'group' => false],
                'heading3' => ['tagName' => 'h3', 'terminal' => true, 'breakOnReturn' => true, 'group' => false],
            ],
            'textAttributes' => [
                'color' => ['styleProperty' => 'color', 'inheritable' => true],
                'underline' => ['tagName' => 'u', 'inheritable' => true],
            ],
        ];

        $package = new PathPackage(
            '/bundles/easyadmintrixextension',
            new JsonManifestVersionStrategy(__DIR__ . '/../../public/manifest.json'),
        );

        return TextEditorField::new($propertyName, $label)
            ->setTrixEditorConfig($customConfig)
            ->addCssFiles($package->getUrl('extended-trix.css'))
            ->addJsFiles($package->getUrl('extended-trix.js'));
    }
}
