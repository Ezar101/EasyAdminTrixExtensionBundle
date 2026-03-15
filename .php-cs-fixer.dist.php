<?php

declare(strict_types=1);

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__ . '/src')
    ->in(__DIR__ . '/tests')
    ->append([__FILE__])
    ->ignoreDotFiles(true)
    ->ignoreVCS(true)
    ->files()
    ->name('*.php');

return new PhpCsFixer\Config()
    ->setParallelConfig(PhpCsFixer\Runner\Parallel\ParallelConfigFactory::detect())
    ->setRules([
        '@Symfony' => true,
        '@Symfony:risky' => true,
        '@PHP84Migration' => true,
        'declare_strict_types' => true,
        'global_namespace_import' => [
            'import_classes' => true,
            'import_constants' => true,
            'import_functions' => true,
        ],
        'yoda_style' => false, // Disable the Yoda style (e.g., if (null === $var)) if you prefer the classic style (if ($var === null)).
        'concat_space' => ['spacing' => 'one'], // Adds a space around the concatenation points
    ])
    ->setUsingCache(true)
    ->setRiskyAllowed(true)
    ->setFinder($finder)
    ->setCacheFile(__DIR__ . '/var/cache/.php-cs-fixer.cache'); // Put the cache away neatly.
