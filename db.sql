-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  Dim 01 avr. 2018 à 14:14
-- Version du serveur :  5.7.19
-- Version de PHP :  5.6.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de données :  `test_hh`
--

-- --------------------------------------------------------

--
-- Structure de la table `history`
--

DROP TABLE IF EXISTS `history`;
CREATE TABLE IF NOT EXISTS `history` (
  `id_player` mediumint(8) UNSIGNED NOT NULL,
  `id_view` smallint(5) UNSIGNED NOT NULL,
  `lvl` smallint(5) UNSIGNED NOT NULL,
  `victory_points_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `victory_points_value` int(11) DEFAULT NULL,
  `pvp_wins_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `pvp_wins_value` smallint(5) UNSIGNED DEFAULT NULL,
  `troll_wins_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `troll_wins_value` smallint(5) UNSIGNED DEFAULT NULL,
  `soft_currency_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `soft_currency_value` int(10) UNSIGNED DEFAULT NULL,
  `experience_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `experience_value` mediumint(8) UNSIGNED DEFAULT NULL,
  `girls_won_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `girls_won_value` smallint(5) UNSIGNED DEFAULT NULL,
  `stats_upgrade_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `stats_upgrade_value` smallint(5) UNSIGNED DEFAULT NULL,
  `girls_affection_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `girls_affection_value` mediumint(8) UNSIGNED DEFAULT NULL,
  `harem_level_rank` mediumint(8) UNSIGNED DEFAULT NULL,
  `harem_level_value` smallint(5) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id_player`,`id_view`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `players`
--

DROP TABLE IF EXISTS `players`;
CREATE TABLE IF NOT EXISTS `players` (
  `id_player` mediumint(8) UNSIGNED NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `country` varchar(4) NOT NULL,
  PRIMARY KEY (`id_player`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `views`
--

DROP TABLE IF EXISTS `views`;
CREATE TABLE IF NOT EXISTS `views` (
  `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `delta_daily`
--

DROP TABLE IF EXISTS `delta_daily`;
CREATE TABLE `delta_daily` (
  `id_player` mediumint(8) UNSIGNED NOT NULL,
  `lvl` smallint(5) UNSIGNED NOT NULL,
  `victory_points_rank` mediumint(8) DEFAULT NULL,
  `victory_points_value` int(11) DEFAULT NULL,
  `pvp_wins_rank` mediumint(8) DEFAULT NULL,
  `pvp_wins_value` smallint(5) UNSIGNED DEFAULT NULL,
  `troll_wins_rank` mediumint(8) DEFAULT NULL,
  `troll_wins_value` smallint(5) UNSIGNED DEFAULT NULL,
  `soft_currency_rank` mediumint(8) DEFAULT NULL,
  `soft_currency_value` int(10) UNSIGNED DEFAULT NULL,
  `experience_rank` mediumint(8) DEFAULT NULL,
  `experience_value` mediumint(8) UNSIGNED DEFAULT NULL,
  `girls_won_rank` mediumint(8) DEFAULT NULL,
  `girls_won_value` smallint(5) UNSIGNED DEFAULT NULL,
  `stats_upgrade_rank` mediumint(8) DEFAULT NULL,
  `stats_upgrade_value` smallint(5) UNSIGNED DEFAULT NULL,
  `girls_affection_rank` mediumint(8) DEFAULT NULL,
  `girls_affection_value` mediumint(8) UNSIGNED DEFAULT NULL,
  `harem_level_rank` mediumint(8) DEFAULT NULL,
  `harem_level_value` smallint(5) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id_player`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `delta_weekly`
--

DROP TABLE IF EXISTS `delta_weekly`;
CREATE TABLE `delta_weekly` (
  `id_player` mediumint(8) UNSIGNED NOT NULL,
  `lvl` smallint(5) UNSIGNED NOT NULL,
  `victory_points_rank` mediumint(8) DEFAULT NULL,
  `victory_points_value` int(11) DEFAULT NULL,
  `pvp_wins_rank` mediumint(8) DEFAULT NULL,
  `pvp_wins_value` smallint(5) UNSIGNED DEFAULT NULL,
  `troll_wins_rank` mediumint(8) DEFAULT NULL,
  `troll_wins_value` smallint(5) UNSIGNED DEFAULT NULL,
  `soft_currency_rank` mediumint(8) DEFAULT NULL,
  `soft_currency_value` int(10) UNSIGNED DEFAULT NULL,
  `experience_rank` mediumint(8) DEFAULT NULL,
  `experience_value` mediumint(8) UNSIGNED DEFAULT NULL,
  `girls_won_rank` mediumint(8) DEFAULT NULL,
  `girls_won_value` smallint(5) UNSIGNED DEFAULT NULL,
  `stats_upgrade_rank` mediumint(8) DEFAULT NULL,
  `stats_upgrade_value` smallint(5) UNSIGNED DEFAULT NULL,
  `girls_affection_rank` mediumint(8) DEFAULT NULL,
  `girls_affection_value` mediumint(8) UNSIGNED DEFAULT NULL,
  `harem_level_rank` mediumint(8) DEFAULT NULL,
  `harem_level_value` smallint(5) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id_player`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `delta_monthly`
--

DROP TABLE IF EXISTS `delta_monthly`;
CREATE TABLE `delta_monthly` (
  `id_player` mediumint(8) UNSIGNED NOT NULL,
  `lvl` smallint(5) UNSIGNED NOT NULL,
  `victory_points_rank` mediumint(8) DEFAULT NULL,
  `victory_points_value` int(11) DEFAULT NULL,
  `pvp_wins_rank` mediumint(8) DEFAULT NULL,
  `pvp_wins_value` smallint(5) UNSIGNED DEFAULT NULL,
  `troll_wins_rank` mediumint(8) DEFAULT NULL,
  `troll_wins_value` smallint(5) UNSIGNED DEFAULT NULL,
  `soft_currency_rank` mediumint(8) DEFAULT NULL,
  `soft_currency_value` int(10) UNSIGNED DEFAULT NULL,
  `experience_rank` mediumint(8) DEFAULT NULL,
  `experience_value` mediumint(8) UNSIGNED DEFAULT NULL,
  `girls_won_rank` mediumint(8) DEFAULT NULL,
  `girls_won_value` smallint(5) UNSIGNED DEFAULT NULL,
  `stats_upgrade_rank` mediumint(8) DEFAULT NULL,
  `stats_upgrade_value` smallint(5) UNSIGNED DEFAULT NULL,
  `girls_affection_rank` mediumint(8) DEFAULT NULL,
  `girls_affection_value` mediumint(8) UNSIGNED DEFAULT NULL,
  `harem_level_rank` mediumint(8) DEFAULT NULL,
  `harem_level_value` smallint(5) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id_player`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
COMMIT;
