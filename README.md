# EasyAdmin Trix Extension Bundle

[![Latest Stable Version](https://poser.pugx.org/Ezar101/EasyAdminTrixExtensionBundle/v)](https://packagist.org/packages/ezar101/easyadmin-trix-extension-bundle)
[![Total Downloads](https://poser.pugx.org/Ezar101/EasyAdminTrixExtensionBundle/downloads)](https://packagist.org/packages/ezar101/easyadmin-trix-extension-bundle)
[![License](https://poser.pugx.org/Ezar101/EasyAdminTrixExtensionBundle/license)](https://packagist.org/packages/ezar101/easyadmin-trix-extension-bundle)

This Symfony bundle extends the native capabilities of EasyAdmin's `TextEditorField` (based on Trix). It offers an enhanced writing experience by adding essential features that are missing by default, all without any complex front-end configuration.

## ✨ Features

* **Table Management :** Complete modal interface for inserting, modifying, adding/deleting rows and columns.
* **Semantic titles :** Adding tags `<h2>` and `<h3>`.
* **Text formatting :** Button to underline the text (`<u>`).
* **Color palette :** Integrated color picker to change text color on the fly.
* **Ready to use :** Pre-compiled and automatically injected assets (CSS/JS).

## 📦 Installation

Use Composer to install the bundle:

```bash
composer require ezar101/easyadmin-trix-extension-bundle
```

Next, install the public assets of the bundle (if Symfony does not do so automatically):

```bash
php bin/console assets:install
```

## 🚀 Use

In your EasyAdmin CRUD controllers, simply replace the native `TextEditorField` with the `ExtendedTextEditorField` provided by this bundle.

```php
<?php

namespace App\Controller\Admin;

use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use Ezar101\EasyAdminTrixExtensionBundle\Field\ExtendedTextEditorField; // <-- Import of the new field

class PostCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Post::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield ExtendedTextEditorField::new('content')
            ->setNumOfRows(10)
            ->setColumns(12);
            
        // You can use all the usual TextEditorField methods
    }
}
```

That's it! The bundle automatically injects the Trix configuration (blockAttributes, textAttributes) as well as the necessary CSS and JS files into the EasyAdmin interface.

## 🛠 Architecture & Assets

The assets (JavaScript and CSS) required for the operation of the new Trix options (including the complex table manager) are pre-compiled and distributed in the `public/` folder of the bundle.

If you are using Webpack Encore, Vite, or Importmap in your main project, you do not need to perform **any additional configuration**. The `ExtendedTextEditorField` injects its own dependencies independently via Symfony's asset system.

## 🤝 Contribution

Pull requests are welcome.

If you wish to modify the JavaScript or CSS source code:

1. Clone this repository.
2. Edit the files in the `assets/` folder.
3. Recompile the assets to update the `public/` folder.

## 📄 Licence

This project is licensed under the MIT license.
