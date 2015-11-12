<?php
	namespace Modules\content;
	require 'OBJECT_Node.php';
	require 'REST_Node.php';
	require 'REST_Struct.php';

	global $moduleManager;

	function fetchContentPayload($inData, $noNodes = FALSE){
		global $cache;

		$checksum = '';
		$structs = NULL;
		$structFiles = glob('../lib/data/struct/*.json');
		foreach($structFiles as $filename){
			$checksum .= filesize($filename) . '.';
		}
		$checksum = md5($checksum);

		//Nothing changed?
		if($checksum === $cache->get('structChecksum')){
			$structs = $cache->get('structs');
		}

		if(!$structs){
			$structs = fetchStructs($structFiles);
			$cache->set('structChecksum', $checksum);
			$cache->set('structs', $structs);
		}


		$checksum = '';
		$templates = NULL;
		$templateFiles = glob('../lib/data/templates/*.twig');
		foreach($templateFiles as $filename){
			$checksum .= filesize($filename) . '.';
		}
		$checksum = md5($checksum);

		if($checksum === $cache->get('templateChecksum')){
			$templates = $cache->get('templates');
		}

		if(!$templates){
			$templates = fetchTemplates($templateFiles);
			$cache->set('templateChecksum', $checksum);
			$cache->set('templates', $templates);
		}

		$inData['structs'] = $structs;
		$inData['templates'] = $templates;

		if(!$noNodes){
			$inData['nodes'] = \CMS\Objects\Node::getPayload();
		}

		return $inData;
	}

	/**
	 * Read and parse the struct files from the hdd.
	 */
	function fetchStructs($structFiles){
		$result = array();

		foreach($structFiles as $file){
			$content = json_decode(file_get_contents($file), TRUE);
			$key = substr($file, 19, -5);
			if(!$content){
				$result[] = array(
					'key' => $key,
					'title' => $key,
					'broken' => TRUE
				);
				continue;
			}

			$result[] = array(
				'key' => $key,
				'title' => isset($content['title']) ? $content['title'] : $key,
				'description' => isset($content['description']) ? $content['description'] : ''
			);
		}

		return $result;
	}

	/**
	 * Read and parse the template files from the hdd.
	 */
	function fetchTemplates($templateFiles){
		$result = array();
		$infoLabels = array(
			'title' => 1,
			'description' => 1,
			'author' => 1,
			'date' => 1
		);

		foreach($templateFiles as $file){
			$key = substr($file, 22, -5);

			if(substr($key, 0, 1) === '_'){
				continue;
			}

			$content = file_get_contents($file);

			$info = array(
				'key' => $key
			);

			if(preg_match('/{#cmsInfo(.+?)#}/ism', $content, $matches)){
				$infoBlock = explode("\n", $matches[1]);
				foreach($infoBlock as $i){
					$i = explode(':', trim($i));
					$label = strtolower(array_shift($i));
					$content = trim(implode(':', $i));
					if(isset($infoLabels[$label])){
						$info[$label] = $content;
					}
				}
			}

			$result[] = $info;
		}

		return $result;
	}

	$moduleManager->register('getPayload', '\Modules\content\fetchContentPayload');