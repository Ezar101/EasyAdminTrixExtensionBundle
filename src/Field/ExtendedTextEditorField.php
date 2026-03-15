<?php

declare(strict_types=1);

namespace Ezar101\EasyAdminTrixExtensionBundle\Field;

use EasyCorp\Bundle\EasyAdminBundle\Config\Asset as EasyAdminAsset;
use EasyCorp\Bundle\EasyAdminBundle\Contracts\Field\FieldInterface;
use EasyCorp\Bundle\EasyAdminBundle\Field\FieldTrait;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Form\Type\TextEditorType;
use Ezar101\EasyAdminTrixExtensionBundle\Config\Asset;
use InvalidArgumentException;
use Symfony\Contracts\Translation\TranslatableInterface;

use function sprintf;

final class ExtendedTextEditorField implements FieldInterface
{
    use FieldTrait;

    public static function new(string $propertyName, TranslatableInterface|bool|string|null $label = null): self
    {
        return (new self())
            ->setProperty($propertyName)
            ->setLabel($label)
            ->setTemplateName('crud/field/text_editor')
            ->setFormType(TextEditorType::class)
            ->addCssClass('field-text_editor')
            ->addCssFiles(
                EasyAdminAsset::fromEasyAdminAssetPackage('field-text-editor.css')->onlyOnForms(),
                Asset::from('extended-trix.css'),
            )
            ->addJsFiles(
                EasyAdminAsset::fromEasyAdminAssetPackage('field-text-editor.js')->onlyOnForms(),
                Asset::from('extended-trix.js'),
            )
            ->setColumns('col-md-9 col-xxl-7')
            ->setCustomOption(TextEditorField::OPTION_NUM_OF_ROWS, null)
            ->setDefaultTrixConfig();
    }

    /** @see TextEditorField::setNumOfRows() */
    public function setNumOfRows(int $rows): self
    {
        if ($rows < 1) {
            throw new InvalidArgumentException(sprintf('The argument of the "%s()" method must be 1 or higher (%d given).', __METHOD__, $rows));
        }

        $this->setCustomOption(TextEditorField::OPTION_NUM_OF_ROWS, $rows);

        return $this;
    }

    /**
     * @param array<string, mixed> $config
     *
     * @see TextEditorField::setTrixEditorConfig()
     */
    public function setTrixEditorConfig(array $config): self
    {
        $this->setCustomOption(TextEditorField::OPTION_TRIX_EDITOR_CONFIG, $config);

        return $this;
    }

    private function setDefaultTrixConfig(): self
    {
        return $this->setTrixEditorConfig([
            'blockAttributes' => [
                'default' => ['tagName' => 'p', 'parse' => false],
                'heading2' => ['tagName' => 'h2', 'terminal' => true, 'breakOnReturn' => true, 'group' => false],
                'heading3' => ['tagName' => 'h3', 'terminal' => true, 'breakOnReturn' => true, 'group' => false],
            ],
            'textAttributes' => [
                'color' => ['styleProperty' => 'color', 'inheritable' => true],
                'underline' => ['tagName' => 'u', 'inheritable' => true],
            ],
        ]);
    }
}
