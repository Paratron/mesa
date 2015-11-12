<?php
/**
 * This defines the REST interface to interact with the struct object type (content structure definition).
 */

namespace CMS\REST;

class Struct extends RestResponder
{
	function GET($requestData, $path)
	{
		if(isset($path[0])){
			$structId = $path[0];

			if(stristr($structId, '..')){
				throw new RestError('Malformed struct id', 12);
			}

			$filename = '../lib/data/struct/' . $structId . '.json';

			if(!file_exists($filename)){
				throw new RestError('Struct not found', 13);
			}

			$struct = json_decode(file_get_contents($filename), TRUE);

			return $struct['elements'];
		}

		return \Modules\Content\fetchContentPayload(array(), TRUE);
	}
}