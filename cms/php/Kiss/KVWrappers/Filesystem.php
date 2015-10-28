<?php
/**
 * Filesystem
 * ==========
 * Implements a Key/Value Storage interface for the file system.
 *
 * This may be useful while developing but should be switched
 * to APC when using KVWrappers in a production environment.
 *
 * @author: Christian Engel <hello@wearekiss.com>
 * @version: 2 07.02.15
 */

namespace Kiss\KVWrappers;

class Filesystem extends \Kiss\KeyValueWrapper {

	var $cacheFolder;

	function __construct($cacheFolder) {
		if (substr($cacheFolder, -1) !== '/') {
			$cacheFolder .= '/';
		}

		if (!is_writeable($cacheFolder)) {
			throw new \ErrorException('Cache Folder not writeable');
		}

		$this->cacheFolder = $cacheFolder;
	}

	function get($key) {
		$key = $this->cacheFolder . md5($key);

		if (!file_exists($key)) {
			return NULL;
		}
		$dta = json_decode(file_get_contents($key), TRUE);

		if(!is_array($dta) || !isset($dta[0]) || !isset($dta[1])){
			return NULL;
		}

		if ($dta[1] && $dta[1] < time()) {
			$this->remove($key);
			return NULL;
		}
		return $dta[0];
	}

	function set($key, $value, $expiration = 0) {
		$key = $this->cacheFolder . md5($key);

		if ($expiration && $expiration < 2592000) {
			$expiration = $expiration + time();
		}

		return file_put_contents($key, json_encode(array(
				$value,
				$expiration
		)));
	}

	function remove($key) {
		$key = $this->cacheFolder . md5($key);
		if (file_exists($key)) {
			unlink($key);
		}
	}
}
