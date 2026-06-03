<?php
defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', 'apicem_tema_enqueue' );
function apicem_tema_enqueue() {
	// Parent theme stylesheet
	wp_enqueue_style(
		'apicem-parent',
		get_template_directory_uri() . '/style.css',
		[],
		wp_get_theme( 'twentytwentyfive' )->get( 'Version' )
	);

	// Child theme stylesheet (tokens + overrides)
	wp_enqueue_style(
		'apicem-tema',
		get_stylesheet_directory_uri() . '/style.css',
		[ 'apicem-parent' ],
		wp_get_theme()->get( 'Version' )
	);

	// Google Fonts: Orelega One + Hanken Grotesk
	wp_enqueue_style(
		'apicem-fonts',
		'https://fonts.googleapis.com/css2?family=Orelega+One&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap',
		[],
		null
	);
}

add_action( 'after_setup_theme', 'apicem_tema_setup' );
function apicem_tema_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	// Preconnect to Google Fonts
	add_filter( 'wp_resource_hints', 'apicem_preconnect_fonts', 10, 2 );
}

function apicem_preconnect_fonts( $hints, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$hints[] = 'https://fonts.googleapis.com';
		$hints[] = 'https://fonts.gstatic.com';
	}
	return $hints;
}
