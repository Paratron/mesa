<?php

namespace CMS\REST;


class User extends RestResponder
{
	function GET($requestData, $path){
		$this->requireToken();

		if(isset($path[0])){
			if($path[0] === 'payload'){
				global $moduleManager;
				$payload = $moduleManager->trigger('getPayload', array());

				return array(
					'payload' => array_merge($payload, array(
						'user' => $this->user->getJSON()
					))
				);
			}
		}
	}

	function POST($requestData, $path)
	{

		if (isset($path[0])) {
			switch ($path[0]) {
				case 'login':
					$i = \Kiss\Utils::array_clean($requestData, array(
							'user' => 'mail',
							'pass' => 'string'
					));

					if(!$i['user'] || !$i['pass']){
						throw new RestError('No username and/or password given.', 4);
					}

					try{
						$u = new \CMS\Objects\User($i['user']);
					} catch(\ErrorException $e){
						throw new RestError('Unknown user', 5);
					}

					if(!$u->auth($i['pass'])){
						throw new RestError('Wrong password', 6);
					}

					global $cache;

					$token = md5(uniqid('', TRUE));
					$cache->set('token_' . $token, $u->id, strtotime('+8 hours'));

					global $moduleManager;
					$payload = $moduleManager->trigger('getPayload', array());

					return array(
						'token' => $token,
						'payload' => array_merge($payload, array(
							'user' => $u->getJSON()
						))
					);

					break;
			}
		}
	}
}