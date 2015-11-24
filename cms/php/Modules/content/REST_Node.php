<?php
/**
 * This defines the REST interface to interact with the node object type (pages).
 */

namespace CMS\REST;

class Node extends RestResponder
{
	function GET($requestData, $path)
	{
		if (!count($path)) {
			return NULL;
		}

		if (isset($path[0])) {
			$nodeId = (int)$path[0];
		} else {
			throw new RestError('Invalid node id given', 12);
		}

		try {
			$node = new \CMS\Objects\Node($nodeId);
		} catch (\ErrorException $e) {
			throw new RestError('Node not found', 13, $nodeId);
		}

		return $node->content ? $node->content : NULL;
	}

	function PUT($requestData, $path)
	{
		if (!count($path)) {
			return NULL;
		}

		if (isset($path[0])) {
			$nodeId = (int)$path[0];
		} else {
			throw new RestError('Invalid node id given', 12);
		}

		try {
			$node = new \CMS\Objects\Node($nodeId);
		} catch (\ErrorException $e) {
			throw new RestError('Node not found', 13, $nodeId);
		}

		$input = \Kiss\Utils::array_clean($requestData, array(
			'key' => 'string|trim',
			'value' => 'string'
		));

		$input['value'] = json_decode($input['value'], TRUE);
		if(json_last_error() !== JSON_ERROR_NONE){
			throw new RestError('Invalid field value given');
		}

		$node->updateContent($input['key'], $input['value']);
		$node->save();

		return TRUE;
	}

	function POST($requestData, $path)
	{
		$requestData = \Kiss\Utils::array_clean($requestData, array(
			'title' => 'string|trim',
			'urlFragment' => 'string|trim',
			'parentId' => 'int',
			'langLink' => 'string|trim',
			'langKey' => 'string|limit|2',
			'config' => 'array',
			'content' => 'array',
			'groupIndex' => 'int',
			'structKey' => 'string|trim',
			'templateKey' => 'string|trim'
		));

		if (!$requestData['title']) {
			throw new RestError('Title missing', 8);
		}

		if (!$requestData['urlFragment']) {
			throw new RestError('URL fragment missing', 9);
		}

		$requestData['urlFragment'] = strtolower($requestData['urlFragment']);

		//Check if parent node exists.
		if ($requestData['parentId']) {
			if (\CMS\Objects\Node::exists($requestData['parentId']) === FALSE) {
				throw new RestError('Parent node doesnt exist', 10);
			}
		}

		//Check if there is another node with the same urlFragment on this level.
		if (\CMS\Objects\Node::exists($requestData['urlFragment'], $requestData['parentId'])) {
			throw new RestError('Another node with this urlFragment exists on this level', 11);
		}

		$node = new \CMS\Objects\Node();

		$node->title = $requestData['title'];
		$node->urlFragment = $requestData['title'];
		$node->parentId = $requestData['parentId'];
		$node->langLink = $requestData['langLink'];
		$node->langKey = $requestData['langKey'];
		$node->config = $requestData['config'];
		$node->content = $requestData['content'];
		$node->groupIndex = $requestData['groupIndex'];
		$node->structKey = $requestData['structKey'];
		$node->templateKey = $requestData['templateKey'];

		$node->save();

		return $node->getJSON();
	}
}