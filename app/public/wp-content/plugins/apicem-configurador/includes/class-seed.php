<?php
defined( 'ABSPATH' ) || exit;

class Apicem_Seed {

	public static function run() {
		if ( get_option( 'apicem_seeded' ) ) return;

		self::seed_acabamentos();
		self::seed_tamanhos();
		self::seed_bordas();
		self::seed_settings();

		update_option( 'apicem_seeded', '1' );
	}

	public static function reset() {
		foreach ( [ 'apicem_tamanho', 'apicem_borda', 'apicem_acabamento' ] as $type ) {
			$posts = get_posts( [ 'post_type' => $type, 'numberposts' => -1, 'post_status' => 'any' ] );
			foreach ( $posts as $p ) wp_delete_post( $p->ID, true );
		}
		delete_option( 'apicem_wizard' );
		delete_option( 'apicem_hero' );
		delete_option( 'apicem_caixa_eletrica' );
		delete_option( 'apicem_whatsapp' );
		delete_option( 'apicem_lead' );
		delete_option( 'apicem_integracoes' );
		delete_option( 'apicem_entrega' );
		delete_option( 'apicem_seeded' );
	}

	private static function insert( $type, $title, $order, $meta ) {
		$id = wp_insert_post( [
			'post_type'   => $type,
			'post_title'  => $title,
			'post_status' => 'publish',
			'menu_order'  => $order,
		] );
		if ( $id && ! is_wp_error( $id ) ) {
			foreach ( $meta as $k => $v ) update_post_meta( $id, $k, $v );
		}
	}

	private static function seed_acabamentos() {
		$items = [
			[ 'Carvalho Avelã',   '#D3A584', 'madeira' ],
			[ 'Carvalho Prata',   '#DDB999', 'madeira' ],
			[ 'Freijó Puro',      '#C28960', 'madeira' ],
			[ 'Nogueira Caiena',  '#B47553', 'madeira' ],
			[ 'Gianduia Puro',    '#ADA191', 'solido'  ],
			[ 'Cinza Original',   '#A4A095', 'solido'  ],
			[ 'Argila',           '#F1F0E0', 'solido'  ],
			[ 'Branco',           '#FFFFFF', 'solido'  ],
			[ 'Grafite',          '#4A4845', 'solido'  ],
		];
		foreach ( $items as $i => [ $nome, $hex, $tipo ] ) {
			self::insert( 'apicem_acabamento', $nome, $i, [
				'_apicem_hex'  => $hex,
				'_apicem_tipo' => $tipo,
				'_apicem_ativo' => '1',
			] );
		}
	}

	private static function seed_tamanhos() {
		$items = [
			[ 'Compacta 120 × 70 cm', 120, 70 ],
			[ 'Padrão 140 × 70 cm',   140, 70 ],
			[ 'Ampla 160 × 70 cm',    160, 70 ],
		];
		foreach ( $items as $i => [ $nome, $l, $p ] ) {
			self::insert( 'apicem_tamanho', $nome, $i, [
				'_apicem_largura_cm'      => $l,
				'_apicem_profundidade_cm' => $p,
				'_apicem_ativo'           => '1',
			] );
		}
	}

	private static function seed_bordas() {
		$items = [
			[ 'Linear', 'Perfil reto, linhas retas e arquitetônicas.',       'reta'        ],
			[ 'Bisel',  'Chanfro a 45°, leitura fina e contemporânea.',      'chanfrada'   ],
			[ 'Curva',  'Cantos arredondados, toque suave e ergonômico.',     'arredondada' ],
		];
		foreach ( $items as $i => [ $nome, $desc, $perfil ] ) {
			self::insert( 'apicem_borda', $nome, $i, [
				'_apicem_descricao' => $desc,
				'_apicem_perfil'    => $perfil,
				'_apicem_ativo'     => '1',
			] );
		}
	}

	private static function seed_settings() {
		$steps = [
			[ 'numero' => 1, 'slug' => 'hero',    'ativo' => true,  'kicker' => 'MESA SIT-STAND PERSONALIZÁVEL', 'titulo' => 'A sua mesa, do seu jeito.',                     'texto_apoio' => 'Mesa de altura ajustável, feita sob medida para o seu espaço. Você escolhe o tamanho, a borda e o acabamento — e nós entregamos. Engenharia Riccó, desde 1875.' ],
			[ 'numero' => 2, 'slug' => 'tamanho', 'ativo' => true,  'kicker' => '02 · TAMANHO',                  'titulo' => 'Escolha o tamanho ideal para o seu espaço.',     'texto_apoio' => 'Profundidade de 70 cm em todas — escolha a largura.' ],
			[ 'numero' => 3, 'slug' => 'borda',   'ativo' => true,  'kicker' => '03 · BORDA',                    'titulo' => 'Escolha o perfil da borda.',                     'texto_apoio' => 'O perfil da borda muda o caráter da mesa.' ],
			[ 'numero' => 4, 'slug' => 'acabamento', 'ativo' => true, 'kicker' => '04 · ACABAMENTO',             'titulo' => 'Escolha o acabamento do tampo.',                 'texto_apoio' => 'Nove acabamentos melamínicos de alta resistência.' ],
			[ 'numero' => 5, 'slug' => 'caixa',   'ativo' => true,  'kicker' => '05 · ENERGIA',                  'titulo' => 'Quer uma caixa elétrica integrada?',             'texto_apoio' => 'Tomadas e passagem de cabos embutidas no tampo — a fiação corre escondida pela estrutura até o chão.' ],
			[ 'numero' => 6, 'slug' => 'cep',     'ativo' => true,  'kicker' => '06 · ENTREGA',                  'titulo' => 'Onde você quer receber?',                        'texto_apoio' => 'Informe seu CEP.' ],
			[ 'numero' => 7, 'slug' => 'resumo',  'ativo' => true,  'kicker' => '07 · ORÇAMENTO',                'titulo' => 'Pronto! Receba seu orçamento.',                  'texto_apoio' => 'Confira suas escolhas e envie para receber o orçamento pelo WhatsApp.' ],
		];
		add_option( 'apicem_wizard', $steps );

		add_option( 'apicem_hero', [
			'h1'        => 'A sua mesa, do seu jeito.',
			'h2'        => 'Mesa de altura ajustável, feita sob medida para o seu espaço.',
			'cta_texto' => 'Monte a sua',
			'media_id'  => 0,
		] );

		add_option( 'apicem_caixa_eletrica', [
			'ativo'  => true,
			'label'  => 'Caixa elétrica integrada',
			'texto'  => 'Tomadas e passagem de cabos embutidas no tampo.',
			'preco'  => '',
		] );

		add_option( 'apicem_whatsapp', [
			'telefone' => '',
			'template' => "Olá! Montei a minha Mesa Apicem e queria um orçamento.\n• Tamanho: {tamanho}\n• Borda: {borda}\n• Acabamento: {acabamento}\n• Caixa elétrica: {sim_nao}\n• CEP: {cep} — {cidade}/{uf}\nNome: {nome} · E-mail: {email} · Telefone: {telefone}",
		] );

		add_option( 'apicem_lead', [
			'campos'    => [ 'nome', 'telefone', 'email' ],
			'labels'    => [ 'nome' => 'Nome completo', 'telefone' => 'WhatsApp / Telefone', 'email' => 'E-mail' ],
			'lgpd_texto' => 'Li e aceito a Política de Privacidade.',
			'politica_url' => '/politica-de-privacidade',
		] );

		add_option( 'apicem_integracoes', [ 'ga4_id' => '', 'pixel_id' => '' ] );
		add_option( 'apicem_entrega',     [ 'cep_autocomplete' => true ] );
	}
}
