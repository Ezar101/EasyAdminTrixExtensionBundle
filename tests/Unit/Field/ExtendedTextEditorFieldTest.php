<?php

declare(strict_types=1);

namespace Ezar101\EasyAdminTrixExtensionBundle\Tests\Unit\Field;

use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Form\Type\TextEditorType;
use Ezar101\EasyAdminTrixExtensionBundle\Field\ExtendedTextEditorField;
use InvalidArgumentException;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class ExtendedTextEditorFieldTest extends KernelTestCase
{
    public function testFieldHasCorrectDefaults(): void
    {
        $field = ExtendedTextEditorField::new('content', 'Post Content');
        $dto = $field->getAsDto();

        self::assertSame('content', $dto->getProperty());
        self::assertSame('Post Content', $dto->getLabel());
        self::assertSame('crud/field/text_editor', $dto->getTemplateName());
        self::assertSame(TextEditorType::class, $dto->getFormType());
        self::assertSame('field-text_editor', $dto->getCssClass());
        self::assertSame('col-md-9 col-xxl-7', $dto->getColumns());
    }

    public function testFieldAssetsAreInjected(): void
    {
        $field = ExtendedTextEditorField::new('content');
        $dto = $field->getAsDto();
        $assets = $dto->getAssets();

        $cssAssets = $assets->getCssAssets();
        /*
         * The value of $cssAssets looks like this:
         * [
         *      "field-text-editor.css" => EasyCorp\Bundle\EasyAdminBundle\Dto\AssetDto {
         *          -value: "field-text-editor.css"
         *      }
         *      "bundles/easyadmintrixextension/extended-trix.xxxx.css" => EasyCorp\Bundle\EasyAdminBundle\Dto\AssetDto {
         *          -value: "bundles/easyadmintrixextension/extended-trix.xxxx.css"
         *      }
         * ]
         */

        self::assertCount(2, $cssAssets);
        self::assertMatchesRegularExpression(
            '/extended-trix.*\.css$/',
            end($cssAssets)->getValue(),
        );

        $jsAssets = $assets->getJsAssets();
        /*
         * The value of $jsAssets looks like this:
         * [
         *      "field-text-editor.js" => EasyCorp\Bundle\EasyAdminBundle\Dto\AssetDto {
         *          -value: "field-text-editor.js"
         *      }
         *      "bundles/easyadmintrixextension/extended-trix.xxxx.js" => EasyCorp\Bundle\EasyAdminBundle\Dto\AssetDto {
         *          -value: "bundles/easyadmintrixextension/extended-trix.xxxx.js"
         *      }
         * ]
         */

        self::assertCount(2, $jsAssets);
        self::assertMatchesRegularExpression(
            '/extended-trix.*\.js$/',
            end($jsAssets)->getValue(),
        );
    }

    public function testDefaultTrixConfigIsSet(): void
    {
        $field = ExtendedTextEditorField::new('content');
        $dto = $field->getAsDto();
        $config = $dto->getCustomOption(TextEditorField::OPTION_TRIX_EDITOR_CONFIG);

        self::assertIsArray($config);
        self::assertArrayHasKey('blockAttributes', $config);
        self::assertArrayHasKey('heading2', $config['blockAttributes']);
        self::assertArrayHasKey('heading3', $config['blockAttributes']);

        self::assertArrayHasKey('textAttributes', $config);
        self::assertArrayHasKey('color', $config['textAttributes']);
        self::assertArrayHasKey('underline', $config['textAttributes']);
    }

    public function testSetNumOfRowsThrowsExceptionForInvalidValue(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('The argument of the "Ezar101\EasyAdminTrixExtensionBundle\Field\ExtendedTextEditorField::setNumOfRows()" method must be 1 or higher (0 given).');

        ExtendedTextEditorField::new('content')->setNumOfRows(0);
    }

    public function testSetNumOfRowsUpdatesCustomOption(): void
    {
        $field = ExtendedTextEditorField::new('content')->setNumOfRows(10);
        $dto = $field->getAsDto();

        self::assertSame(10, $dto->getCustomOption(TextEditorField::OPTION_NUM_OF_ROWS));
    }

    public function testSetTrixEditorConfigOverridesDefaultConfig(): void
    {
        $customConfig = ['foo' => 'bar'];
        $field = ExtendedTextEditorField::new('content')->setTrixEditorConfig($customConfig);
        $dto = $field->getAsDto();

        self::assertSame($customConfig, $dto->getCustomOption(TextEditorField::OPTION_TRIX_EDITOR_CONFIG));
    }
}
