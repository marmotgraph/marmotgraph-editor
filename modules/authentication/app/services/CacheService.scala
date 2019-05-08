/*
 *   Copyright (c) 2018, EPFL/Human Brain Project PCO
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package services

import akka.Done
import play.api.Logger
import play.api.cache.AsyncCacheApi

import scala.concurrent.{ExecutionContext, Future}
import scala.reflect.ClassTag
import cats.syntax.option._

trait CacheService {

  val log = Logger(this.getClass)

  def getOrElse[A: ClassTag](cache: AsyncCacheApi, key: String)(
    orElse: => Future[Option[A]]
  )(implicit executionContext: ExecutionContext): Future[Option[A]] = {
    get[A](cache, key).flatMap {
      case Some(elem) => Future(elem.some)
      case None =>
        log.debug("Cache element not found executing orElse")
        orElse
    }
  }

  def get[A: ClassTag](cache: AsyncCacheApi, key: String)(
    implicit executionContext: ExecutionContext
  ): Future[Option[A]] = cache.get[A](key)

  def clearCache(cache: AsyncCacheApi): Future[Done] = cache.removeAll()

  def set[A: ClassTag](cache: AsyncCacheApi, key: String, value: A)(
    implicit executionContext: ExecutionContext
  ): Future[Done] = {
    cache.set(key, value)
  }
}
